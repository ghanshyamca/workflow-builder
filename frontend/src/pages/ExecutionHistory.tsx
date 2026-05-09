import React, { useState, useEffect } from 'react'
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
  created_at: string
}

export const ExecutionHistory: React.FC = () => {
  const { workflowId } = useParams<{ workflowId: string }>()
  const navigate = useNavigate()
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const limit = 20
  const offset = (page - 1) * limit

  useEffect(() => {
    if (!workflowId) return

    const fetchExecutions = async () => {
      try {
        setLoading(true)
        const response = await api.getExecutionsByWorkflow(workflowId, limit, offset)
        setExecutions(response.data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load executions')
      } finally {
        setLoading(false)
      }
    }

    fetchExecutions()
  }, [workflowId, page])

  const filteredExecutions =
    statusFilter === 'all'
      ? executions
      : executions.filter((e) => e.status === statusFilter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300'
      case 'running':
        return 'bg-blue-500/20 text-blue-300'
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

  if (loading && executions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-slate-400">Loading executions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(`/workflows/${workflowId}`)}
          className="text-emerald-400 hover:text-emerald-300 mb-4 text-sm font-medium transition"
        >
          ← Back to Workflow
        </button>
        <h1 className="text-4xl font-bold text-white mt-2">Execution History</h1>
        <p className="text-slate-400 mt-2">View and monitor all workflow execution runs</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <label className="block text-sm font-medium text-slate-300 mb-3">Filter by Status</label>
        <div className="flex gap-2 flex-wrap">
          {['all', 'completed', 'running', 'failed', 'pending', 'paused'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status)
                setPage(1)
              }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                statusFilter === status
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Executions Table */}
      <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
        {filteredExecutions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p>No executions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Run ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredExecutions.map((execution) => (
                  <tr key={execution.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300">
                      {execution.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          execution.status
                        )}`}
                      >
                        {execution.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(execution.start_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {execution.duration_ms
                        ? `${(execution.duration_ms / 1000).toFixed(2)}s`
                        : execution.status === 'running'
                        ? 'Running...'
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/workflows/${workflowId}/executions/${execution.id}`)}
                        className="px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-medium transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredExecutions.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-400">
            Showing {offset + 1} to {Math.min(offset + limit, filteredExecutions.length)} of {executions.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-50 text-sm font-medium transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={filteredExecutions.length < limit}
              className="px-4 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-50 text-sm font-medium transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExecutionHistory
