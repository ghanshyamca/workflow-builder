import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/services/api'

interface Execution {
  id: string
  workflow_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  start_time: string
  end_time?: string
  duration_ms?: number
  error_message?: string
}

interface NodeExecution {
  id: string
  node_id: string
  node_name: string
  node_type: string
  status: string
  start_time: string
  end_time?: string
  duration_ms?: number
  input_data: Record<string, any>
  output_data?: Record<string, any>
  error_message?: string
}

export const ExecutionDetail: React.FC = () => {
  const { workflowId, runId } = useParams<{ workflowId: string; runId: string }>()
  const navigate = useNavigate()
  const [execution, setExecution] = useState<Execution | null>(null)
  const [nodes, setNodes] = useState<NodeExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<NodeExecution | null>(null)
  const [pausing, setPausing] = useState(false)
  const [resuming, setResuming] = useState(false)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!workflowId || !runId) return

    const fetchExecution = async () => {
      try {
        setLoading(true)
        const response = await api.getExecution(runId)
        setExecution(response.data.run)
        setNodes(response.data.nodes)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load execution')
      } finally {
        setLoading(false)
      }
    }

    fetchExecution()
    // Poll for updates if execution is still running
    const startPolling = (pollRunId?: string) => {
      const id = pollRunId || runId
      if (!id) return
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }

      pollIntervalRef.current = setInterval(async () => {
        try {
          const response = await api.getExecution(id)
          setExecution(response.data.run)
          setNodes(response.data.nodes)

          // Stop polling if execution is complete or paused
          if (['completed', 'failed', 'paused'].includes(response.data.run.status)) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 1000)
    }

    startPolling()

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [workflowId, runId])

  const handlePause = async () => {
    if (!workflowId || !runId) return
    try {
      setPausing(true)
      await api.pauseWorkflow(workflowId, runId)
      const response = await api.getExecution(runId)
      setExecution(response.data.run)
      // Stop polling immediately when paused
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause workflow')
    } finally {
      setPausing(false)
    }
  }

  const handleResume = async () => {
    if (!workflowId || !runId) return
    try {
      setResuming(true)
      await api.resumeWorkflow(workflowId, runId)
      const response = await api.getExecution(runId)
      setExecution(response.data.run)
      // Restart polling if the run is running again
      if (response.data.run.status === 'running') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        pollIntervalRef.current = setInterval(async () => {
          try {
            const r = await api.getExecution(runId)
            setExecution(r.data.run)
            setNodes(r.data.nodes)
            if (['completed', 'failed', 'paused'].includes(r.data.run.status)) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
            }
          } catch (err) {
            console.error('Polling error:', err)
          }
        }, 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume workflow')
    } finally {
      setResuming(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300'
      case 'running':
        return 'bg-blue-500/20 text-blue-300 animate-pulse'
      case 'failed':
        return 'bg-red-500/20 text-red-300'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300'
      case 'paused':
        return 'bg-orange-500/20 text-orange-300'
      default:
        return 'bg-gray-500/20 text-gray-300'
    }
  }

  const isRunning = execution?.status === 'running'
  const isPaused = execution?.status === 'paused'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-slate-400">Loading execution details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-400">{error}</div>
      </div>
    )
  }

  if (!execution) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-slate-400">Execution not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Pause/Resume */}
      <div>
        <button
          onClick={() => navigate(`/workflows/${workflowId}/executions`)}
          className="text-emerald-400 hover:text-emerald-300 mb-4 text-sm font-medium transition"
        >
          ← Back to Executions
        </button>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-4xl font-bold text-white">Execution Details</h1>
          <div className="flex gap-2">
            {isRunning && (
              <button
                onClick={handlePause}
                disabled={pausing}
                className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 disabled:opacity-50 text-sm font-medium"
              >
                {pausing ? 'Pausing...' : 'Pause'}
              </button>
            )}
            {isPaused && (
              <button
                onClick={handleResume}
                disabled={resuming}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50 text-sm font-medium"
              >
                {resuming ? 'Resuming...' : 'Resume'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Execution Summary */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Status</p>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(
                execution.status
              )}`}
            >
              {execution.status}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Started</p>
            <p className="font-medium text-white mt-2">
              {new Date(execution.start_time).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Duration</p>
            <p className="font-medium text-white mt-2">
              {execution.duration_ms ? `${(execution.duration_ms / 1000).toFixed(2)}s` : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Run ID</p>
            <p className="font-medium text-white text-xs mt-2 break-all">{runId?.slice(0, 12)}...</p>
          </div>
        </div>

        {execution.error_message && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-sm font-medium text-red-300">Error</p>
            <p className="text-sm text-red-200 mt-2">{execution.error_message}</p>
          </div>
        )}
      </div>

      {/* Node Executions */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Node Executions</h2>

        {nodes.length === 0 ? (
          <p className="text-slate-400">No node executions</p>
        ) : (
          <div className="space-y-3">
            {nodes.map((node) => {
              const isCurrentlyRunning = node.status === 'running'
              const isCompleted = node.status === 'completed'
              const isFailed = node.status === 'failed'
              
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                  className={`border rounded-lg p-4 cursor-pointer transition ${
                    isCurrentlyRunning
                      ? 'border-blue-400/50 bg-blue-400/10 animate-pulse'
                      : 'border-white/10 hover:bg-white/5'
                  } ${isCompleted ? 'border-green-400/30 bg-green-400/5' : ''} ${
                    isFailed ? 'border-red-400/30 bg-red-400/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {isCurrentlyRunning && (
                          <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
                        )}
                        {isCompleted && (
                          <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                        )}
                        {isFailed && (
                          <div className="h-2 w-2 bg-red-400 rounded-full"></div>
                        )}
                        <h3 className="font-semibold text-white text-lg">{node.node_name}</h3>
                      </div>
                      <p className="text-sm text-slate-400 mt-1 ml-5">{node.node_type}</p>
                    </div>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        node.status
                      )}`}
                    >
                      {node.status}
                    </div>
                  </div>

                  {selectedNode?.id === node.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-300 mb-2">Input Data</p>
                        <pre className="bg-slate-950/50 p-3 rounded text-xs text-slate-300 overflow-auto max-h-40 border border-white/5">
                          {JSON.stringify(node.input_data, null, 2)}
                        </pre>
                      </div>
                      {node.output_data && (
                        <div>
                          <p className="text-sm font-semibold text-slate-300 mb-2">Output Data</p>
                          <pre className="bg-slate-950/50 p-3 rounded text-xs text-slate-300 overflow-auto max-h-40 border border-white/5">
                            {JSON.stringify(node.output_data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {node.error_message && (
                        <div>
                          <p className="text-sm font-semibold text-red-300 mb-2">Error</p>
                          <pre className="bg-red-500/10 p-3 rounded text-xs text-red-300 border border-red-500/30">
                            {node.error_message}
                          </pre>
                        </div>
                      )}
                      {node.duration_ms && (
                        <div className="text-xs text-slate-400">
                          Duration: {(node.duration_ms / 1000).toFixed(2)}s
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExecutionDetail
