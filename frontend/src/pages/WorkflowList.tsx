import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@services/api'

const WorkflowList: React.FC = () => {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.getWorkflows()
      setWorkflows(res.data.data || [])
    } catch (err) {
      console.error('Failed to load workflows', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    try {
      const res = await api.createWorkflow({
        name: 'Untitled workflow',
        description: '',
        definition: { nodes: [], edges: [] },
      })
      const id = res.data.data.id
      navigate(`/workflows/${id}`)
    } catch (err) {
      console.error('Create failed', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return
    try {
      await api.deleteWorkflow(id)
      setWorkflows((s) => s.filter((w) => w.id !== id))
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await api.publishWorkflow(id)
      load()
    } catch (err) {
      console.error('Publish failed', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Workflows</h1>
          <p className="mt-2 text-slate-400">Create and manage your automation workflows</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition"
        >
          + New Workflow
        </button>
      </div>

      {/* Workflows List */}
      {loading ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-slate-400">Loading workflows...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-slate-400 mb-4">No workflows yet. Create your first workflow to get started.</p>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium transition"
              >
                Create Workflow
              </button>
            </div>
          ) : (
            workflows.map((w) => (
              <div
                key={w.id}
                className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition flex justify-between items-center"
              >
                <div className="flex-1">
                  <div className="font-semibold text-white text-lg">{w.name}</div>
                  <div className="text-sm text-slate-400 mt-1">{w.description || 'No description'}</div>
                  <div className="text-xs text-slate-500 mt-2">
                    Status:{' '}
                    <span
                      className={`px-2 py-1 rounded ${
                        w.status === 'published'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/workflows/${w.id}`)}
                    className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-medium transition"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => navigate(`/workflows/${w.id}/executions`)}
                    className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-medium transition"
                  >
                    Executions
                  </button>
                  {w.status !== 'published' && (
                    <button
                      onClick={() => handlePublish(w.id)}
                      className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm font-medium transition"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default WorkflowList
