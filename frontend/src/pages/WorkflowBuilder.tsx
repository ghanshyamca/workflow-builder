import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@services/api'
import CustomNode from '@components/Workflow/CustomNode'
import TriggerManager from '@components/Workflow/TriggerManager'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'

type WorkflowDefinition = {
  nodes: Node[]
  edges: Edge[]
}

const palette = [
  { label: 'HTTP Request', color: '#0ea5e9' },
  { label: 'Condition', color: '#f59e0b' },
  { label: 'Delay', color: '#8b5cf6' },
  { label: 'Notify', color: '#10b981' },
]

const nodeTypes: NodeTypes = {
  workflowNode: CustomNode,
}

const WorkflowBuilder: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')
  const [dirty, setDirty] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [nodeConfig, setNodeConfig] = useState<any>(null)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [executionPreview, setExecutionPreview] = useState<any>(null)
  const nodeCountRef = useRef(0)
  const hydratingRef = useRef(true)

  const nextNodePosition = useMemo(
    () => () => {
      nodeCountRef.current += 1
      const i = nodeCountRef.current
      return {
        x: 120 + (i % 4) * 220,
        y: 80 + Math.floor(i / 4) * 140,
      }
    },
    []
  )

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
      if (!hydratingRef.current) setDirty(true)
    },
    []
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds))
      if (!hydratingRef.current) setDirty(true)
    },
    []
  )

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: false,
            label: 'Next',
          },
          eds
        )
      )
      if (!hydratingRef.current) setDirty(true)
    },
    []
  )

  const executionNodeStatusMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const nodeExecution of executionPreview?.nodes || []) {
      if (nodeExecution?.node_id) {
        map[nodeExecution.node_id] = nodeExecution.status
      }
    }
    return map
  }, [executionPreview])

  const previewNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...(node.data || {}),
          status: executionNodeStatusMap[node.id] || (node.data as any)?.status || 'pending',
        },
      })),
    [nodes, executionNodeStatusMap]
  )

  const load = async () => {
    if (!id) return
    hydratingRef.current = true
    try {
      const res = await api.getWorkflow(id)
      const wf = res.data.data
      setName(wf.name || '')
      const def: WorkflowDefinition = wf.definition || { nodes: [], edges: [] }
      const loadedNodes = Array.isArray(def.nodes)
        ? def.nodes.map((n) => ({
            ...n,
            type: 'workflowNode',
            data: {
              label: n?.data?.label || 'Node',
              nodeType: n?.data?.nodeType || 'Action',
              color: n?.data?.color || '#0ea5e9',
              // Preserve all configuration fields from saved workflow
              ...(n?.data || {}),
            },
          }))
        : []
      const loadedEdges = Array.isArray(def.edges) ? def.edges : []

      setNodes(loadedNodes)
      setEdges(loadedEdges)
      setDirty(false)
    } catch (err) {
      console.error('Failed to load workflow', err)
      setMessage('Failed to load workflow')
    } finally {
      setTimeout(() => {
        hydratingRef.current = false
      }, 0)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  // keep nodeConfig in sync when selection changes
  useEffect(() => {
    if (!selectedNodeId) {
      setNodeConfig(null)
      return
    }
    const node = nodes.find((n) => n.id === selectedNodeId)
    if (!node) {
      setNodeConfig(null)
      return
    }
    // initialize config with node.data (preserve existing keys)
    setNodeConfig({ ...(node.data || {}) })
  }, [selectedNodeId, nodes])

  const handleSave = useCallback(
    async (manual = true) => {
      if (!id) return
      setSaving(true)
      if (manual) setMessage('')
      try {
        const parsed: WorkflowDefinition = { nodes, edges }
        await api.updateWorkflow(id, { name, definition: parsed })
        setDirty(false)
        setMessage(manual ? 'Workflow saved' : `Autosaved at ${new Date().toLocaleTimeString()}`)
      } catch (err) {
        setMessage('Save failed: ' + (err as any)?.message)
      } finally {
        setSaving(false)
      }
    },
    [id, name, nodes, edges]
  )

  const handlePublish = async () => {
    if (!id) return
    setPublishing(true)
    setMessage('')
    try {
      await api.publishWorkflow(id)
      setMessage('Workflow published')
    } catch (err) {
      setMessage('Publish failed: ' + (err as any)?.message)
    } finally {
      setPublishing(false)
    }
  }

  const handleRunNow = async () => {
    if (!id) return
    setRunning(true)
    setMessage('')
    try {
      const res = await api.executeWorkflow(id, { payload: {} })
      const runId = res?.data?.data?.run?.id
      setMessage('Workflow execution started')
      if (runId) {
        setActiveRunId(runId)
        setExecutionPreview(null)
      }
    } catch (err) {
      setMessage('Run failed: ' + (err as any)?.message)
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    if (!activeRunId) return

    let mounted = true

    const refreshPreview = async () => {
      try {
        const response = await api.getExecution(activeRunId)
        if (!mounted) return

        const run = response?.data?.run || response?.data?.data?.run
        const nodesData = response?.data?.nodes || response?.data?.data?.nodes || []
        setExecutionPreview({ run, nodes: nodesData })

        if (run && ['completed', 'failed', 'paused'].includes(run.status)) {
          setMessage(`Workflow ${run.status}`)
        }
      } catch (err) {
        if (mounted) {
          setMessage('Preview refresh failed: ' + (err as any)?.message)
        }
      }
    }

    refreshPreview()
    const interval = window.setInterval(refreshPreview, 1000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [activeRunId])

  const addNode = (nodeType: string, color: string) => {
    const position = nextNodePosition()
    const nodeId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    const newNode: Node = {
      id: nodeId,
      type: 'workflowNode',
      position,
      data: {
        label: `${nodeType}`,
        nodeType,
        color,
      },
    }
    setNodes((prev) => [...prev, newNode])
    setDirty(true)
  }

  const deleteSelected = () => {
    if (!selectedNodeId && !selectedEdgeId) return

    if (selectedNodeId) {
      setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId))
      setEdges((prev) => prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId))
      setSelectedNodeId(null)
      setDirty(true)
      return
    }

    if (selectedEdgeId) {
      setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId))
      setSelectedEdgeId(null)
      setDirty(true)
    }
  }

  const updateSelectedEdgeLabel = (label: string) => {
    if (!selectedEdgeId) return
    setEdges((prev) => prev.map((e) => (e.id === selectedEdgeId ? { ...e, label } : e)))
    setDirty(true)
  }

  useEffect(() => {
    if (!dirty || hydratingRef.current) return
    const timeout = setTimeout(() => {
      handleSave(false)
    }, 1500)

    return () => clearTimeout(timeout)
  }, [dirty, nodes, edges, name, handleSave])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const selectedEdge = edges.find((e) => e.id === selectedEdgeId)
  const selectedPreviewNode = selectedNodeId ? previewNodes.find((n) => n.id === selectedNodeId) : null

  const handleBack = () => {
    if (dirty) {
      const shouldLeave = window.confirm('You have unsaved changes. Leave anyway?')
      if (!shouldLeave) return
    }
    navigate('/workflows')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,_#0b1020_0%,_#0f172a_45%,_#1e293b_100%)] p-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
          <div>
            <h2 className="text-xl font-semibold">Workflow Builder</h2>
            <p className="text-xs text-slate-400">Drag nodes, connect them, and save your workflow definition.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10"
              onClick={handleBack}
            >
              Back
            </button>
            {id && (
              <button
                className="rounded-lg border border-sky-400/50 bg-sky-500/20 px-3 py-2 text-sm hover:bg-sky-500/30"
                onClick={() => navigate(`/workflows/${id}/executions`)}
              >
                Executions
              </button>
            )}
            <button
              className="rounded-lg border border-cyan-400/50 bg-cyan-500/20 px-3 py-2 text-sm hover:bg-cyan-500/30 disabled:opacity-50"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-3 py-2 text-sm hover:bg-emerald-500/30 disabled:opacity-50"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
            <button
              className="rounded-lg border border-violet-400/50 bg-violet-500/20 px-3 py-2 text-sm hover:bg-violet-500/30 disabled:opacity-50"
              onClick={handleRunNow}
              disabled={running}
            >
              {running ? 'Running...' : 'Run Now'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Workflow name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-900/80 p-2 text-sm outline-none ring-cyan-400/50 focus:ring"
                placeholder="My automation"
              />
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Node palette</p>
              <div className="space-y-2">
                {palette.map((item) => (
                  <button
                    key={item.label}
                    className="w-full rounded-lg border px-3 py-2 text-left text-sm transition hover:translate-x-1"
                    style={{ borderColor: `${item.color}55`, background: `${item.color}22` }}
                    onClick={() => addNode(item.label, item.color)}
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
              <p>Nodes: {nodes.length}</p>
              <p>Connections: {edges.length}</p>
              <p>Status: {dirty ? 'Unsaved changes' : 'Saved'}</p>
            </div>

            <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Selection</p>
              <p className="text-xs text-slate-300">
                {selectedNodeId ? `Node: ${selectedNodeId}` : selectedEdgeId ? `Edge: ${selectedEdgeId}` : 'Nothing selected'}
              </p>
              <button
                className="w-full rounded-md border border-rose-400/50 bg-rose-500/10 px-2 py-2 text-xs text-rose-200 hover:bg-rose-500/20 disabled:opacity-40"
                onClick={deleteSelected}
                disabled={!selectedNodeId && !selectedEdgeId}
              >
                Delete selected
              </button>
              {selectedEdge && (
                <input
                  value={(selectedEdge.label as string) || ''}
                  onChange={(e) => updateSelectedEdgeLabel(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-xs outline-none ring-cyan-400/50 focus:ring"
                  placeholder="Edge label"
                />
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Preview</p>
              {selectedPreviewNode ? (
                <div className="space-y-3 rounded-lg border border-white/10 bg-slate-950/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedPreviewNode.data?.label || 'Node'}</p>
                      <p className="text-xs text-slate-400">{selectedPreviewNode.data?.nodeType || 'Node'}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                      {executionNodeStatusMap[selectedPreviewNode.id] || 'ready'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: executionNodeStatusMap[selectedPreviewNode.id] === 'running' ? '70%' : '100%',
                        background:
                          executionNodeStatusMap[selectedPreviewNode.id] === 'running'
                            ? 'linear-gradient(90deg, #3b82f6, #22d3ee)'
                            : executionNodeStatusMap[selectedPreviewNode.id] === 'completed'
                              ? 'linear-gradient(90deg, #10b981, #34d399)'
                              : executionNodeStatusMap[selectedPreviewNode.id] === 'failed'
                                ? 'linear-gradient(90deg, #ef4444, #f97316)'
                                : 'linear-gradient(90deg, #64748b, #94a3b8)',
                      }}
                    />
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/5 p-2 text-xs text-slate-300">
                    <div className="flex justify-between gap-2">
                      <span>Type</span>
                      <span>{selectedPreviewNode.data?.nodeType || '-'}</span>
                    </div>
                    <div className="mt-1 flex justify-between gap-2">
                      <span>Color</span>
                      <span>{selectedPreviewNode.data?.color || '-'}</span>
                    </div>
                    <div className="mt-1 flex justify-between gap-2">
                      <span>Node ID</span>
                      <span className="truncate">{selectedPreviewNode.id}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Select a node to preview its configuration and live status.</p>
              )}

              {activeRunId && (
                <div className="rounded-lg border border-sky-400/20 bg-sky-500/10 p-3 text-xs text-sky-200">
                  <p className="font-medium">Live execution preview</p>
                  <p className="mt-1 break-all">Run: {activeRunId}</p>
                  <p className="mt-1">Status: {executionPreview?.run?.status || 'running'}</p>
                  <button
                    onClick={() => navigate(`/workflows/${id}/executions/${activeRunId}`)}
                    className="mt-2 rounded-md border border-sky-400/30 bg-sky-500/20 px-2 py-1 text-[11px] font-semibold text-sky-100 hover:bg-sky-500/30"
                  >
                    Open run details
                  </button>
                </div>
              )}
            </div>

            {/* Node configuration panel */}
            {selectedNodeId && nodeConfig && (
              <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Node Configuration</p>
                <p className="text-xs text-slate-300">Type: {nodeConfig.nodeType || nodeConfig.label}</p>

                {nodeConfig.nodeType === 'HTTP Request' && (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Method</label>
                    <select
                      value={nodeConfig.method || 'GET'}
                      onChange={(e) => setNodeConfig((s: any) => ({ ...s, method: e.target.value }))}
                      className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-sm outline-none"
                    >
                      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    <label className="text-xs text-slate-400">URL</label>
                    <input
                      value={nodeConfig.url || ''}
                      onChange={(e) => setNodeConfig((s: any) => ({ ...s, url: e.target.value }))}
                      className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-sm outline-none"
                      placeholder="https://api.example.com/endpoint"
                    />

                    <label className="text-xs text-slate-400">Headers (JSON)</label>
                    <textarea
                      value={nodeConfig.headers ? JSON.stringify(nodeConfig.headers, null, 2) : ''}
                      onChange={(e) => {
                        try {
                          const parsed = e.target.value ? JSON.parse(e.target.value) : {}
                          setNodeConfig((s: any) => ({ ...s, headers: parsed }))
                        } catch {
                          // ignore parse errors while typing
                          setNodeConfig((s: any) => ({ ...s, _headersRaw: e.target.value }))
                        }
                      }}
                      className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-sm outline-none h-24"
                    />

                    <label className="text-xs text-slate-400">Body (JSON)</label>
                    <textarea
                      value={nodeConfig.body ? JSON.stringify(nodeConfig.body, null, 2) : ''}
                      onChange={(e) => {
                        try {
                          const parsed = e.target.value ? JSON.parse(e.target.value) : {}
                          setNodeConfig((s: any) => ({ ...s, body: parsed }))
                        } catch {
                          setNodeConfig((s: any) => ({ ...s, _bodyRaw: e.target.value }))
                        }
                      }}
                      className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-sm outline-none h-24"
                    />

                    <label className="text-xs text-slate-400">Max Retries</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={nodeConfig.maxRetries || 3}
                      onChange={(e) => setNodeConfig((s: any) => ({ ...s, maxRetries: parseInt(e.target.value) || 3 }))}
                      className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-sm outline-none"
                    />
                    <p className="text-xs text-slate-400">Number of retry attempts (default 3) with exponential backoff</p>
                  </div>
                )}

                {nodeConfig.nodeType === 'Condition' && (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Expression</label>
                    <input
                      value={nodeConfig.expression || ''}
                      onChange={(e) => setNodeConfig((s: any) => ({ ...s, expression: e.target.value }))}
                      className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-sm outline-none"
                      placeholder="payload.value > 10"
                    />
                    <p className="text-xs text-slate-400">Use JavaScript expression referencing `payload`.</p>
                  </div>
                )}

                {nodeConfig.nodeType === 'Delay' && (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Duration (seconds)</label>
                    <input
                      type="number"
                      min="0"
                      max="3600"
                      step="1"
                      value={nodeConfig.delayMs ? Math.round(nodeConfig.delayMs / 1000) : 5}
                      onChange={(e) => setNodeConfig((s: any) => ({ ...s, delayMs: parseInt(e.target.value) * 1000 || 5000 }))}
                      className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-sm outline-none"
                    />
                    <p className="text-xs text-slate-400">Pause execution for specified seconds (max 3600s / 60 minutes)</p>
                  </div>
                )}

                {nodeConfig.nodeType === 'Notify' && (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Provider</label>
                    <select
                      value={nodeConfig.provider || 'slack'}
                      onChange={(e) => setNodeConfig((s: any) => ({ ...s, provider: e.target.value }))}
                      className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-sm outline-none"
                    >
                      <option value="slack">Slack</option>
                    </select>

                    <label className="text-xs text-slate-400">Slack Webhook URL</label>
                    <input
                      value={nodeConfig.slackWebhookUrl || nodeConfig.webhookUrl || ''}
                      onChange={(e) => setNodeConfig((s: any) => ({ ...s, slackWebhookUrl: e.target.value, webhookUrl: e.target.value }))}
                      className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-sm outline-none"
                      placeholder="https://hooks.slack.com/services/..."
                    />

                    <label className="text-xs text-slate-400">Message</label>
                    <textarea
                      value={nodeConfig.message || ''}
                      onChange={(e) => setNodeConfig((s: any) => ({ ...s, message: e.target.value }))}
                      className="w-full rounded-md border border-white/15 bg-slate-900/80 px-2 py-1 text-sm outline-none h-20"
                      placeholder="Build completed for {{payload.project}}"
                    />
                    <p className="text-xs text-slate-400">
                      Template vars supported, e.g. {'{{payload.key}}'} and {'{{context.runId}}'}.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // save config back to nodes
                      setNodes((prev) =>
                        prev.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, ...nodeConfig } } : n))
                      )
                      setDirty(true)
                    }}
                    className="flex-1 px-3 py-2 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-sm"
                  >
                    Save Node
                  </button>
                  <button
                    onClick={() => setNodeConfig(nodes.find((n) => n.id === selectedNodeId)?.data || null)}
                    className="flex-1 px-3 py-2 rounded-md bg-white/5 text-slate-300 hover:bg-white/10 text-sm"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {id && <TriggerManager workflowId={id} />}

            {message && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-200">{message}</div>
            )}
          </aside>

          <section className="relative h-[72vh] min-h-[520px] rounded-2xl border border-white/10 bg-slate-950/55 overflow-visible">
            <ReactFlow
              nodes={previewNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => {
                setSelectedNodeId(node.id)
                setSelectedEdgeId(null)
              }}
              onEdgeClick={(_, edge) => {
                setSelectedEdgeId(edge.id)
                setSelectedNodeId(null)
              }}
              onPaneClick={() => {
                setSelectedNodeId(null)
                setSelectedEdgeId(null)
              }}
              onEdgeDoubleClick={(_, edge) => {
                setEdges((prev) => prev.filter((e) => e.id !== edge.id))
                setSelectedEdgeId(null)
                setDirty(true)
              }}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
              fitView
            >
              <Controls />
              <MiniMap 
                zoomable 
                pannable 
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  border: '2px solid rgba(148, 163, 184, 0.5)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                }}
              />
              <Background gap={20} size={1} color="#334155" />
            </ReactFlow>
          </section>
        </div>

      </div>
    </div>
  )
}

export default WorkflowBuilder
