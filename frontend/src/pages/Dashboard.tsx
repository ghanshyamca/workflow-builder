import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlayIcon } from '@heroicons/react/24/outline'
import { useAppDispatch, useAppSelector } from '@store/hooks'
import { loadProfileAsync, selectAuthUser } from '@store/auth.slice'

const Dashboard = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectAuthUser)

  useEffect(() => {
    if (!user) {
      dispatch(loadProfileAsync())
    }
  }, [dispatch, user])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Workflow Builder</p>
        <h1 className="mt-2 text-4xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-slate-400">
          {user ? `Welcome back, ${user.firstName || user.username}!` : 'Loading your session...'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create Workflow Card */}
        <div
          onClick={() => navigate('/workflows')}
          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 cursor-pointer hover:bg-emerald-500/20 transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Workflows</h3>
              <p className="mt-2 text-sm text-slate-400">Create, edit, and manage your workflows</p>
            </div>
            <div className="text-emerald-400 text-2xl">⚙️</div>
          </div>
          <button className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm font-medium transition">
            Go to Workflows →
          </button>
        </div>

        {/* Executions Card */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Execution History</h3>
              <p className="mt-2 text-sm text-slate-400">Monitor and track your workflow runs</p>
            </div>
            <div className="text-blue-400 text-2xl">⚡</div>
          </div>
          <button
            onClick={() => navigate('/workflows')}
            className="mt-4 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-medium transition"
          >
            View Executions →
          </button>
        </div>

        {/* Getting Started Card */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Getting Started</h3>
              <p className="mt-2 text-sm text-slate-400">Learn how to build your first workflow</p>
            </div>
            <div className="text-amber-400">
              <PlayIcon className="h-6 w-6" />
            </div>
          </div>
          <button className="mt-4 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-medium transition">
            Learn More →
          </button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h2 className="text-2xl font-semibold text-white mb-6">Platform Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">✓</div>
            </div>
            <div>
              <p className="font-medium text-white">Visual Workflow Builder</p>
              <p className="text-sm text-slate-400 mt-1">Drag-and-drop interface to design workflows</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">✓</div>
            </div>
            <div>
              <p className="font-medium text-white">Multiple Trigger Types</p>
              <p className="text-sm text-slate-400 mt-1">HTTP, Schedule, Manual, and Webhook triggers</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">✓</div>
            </div>
            <div>
              <p className="font-medium text-white">Execution Tracking</p>
              <p className="text-sm text-slate-400 mt-1">Monitor each workflow run in detail</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">✓</div>
            </div>
            <div>
              <p className="font-medium text-white">Error Handling</p>
              <p className="text-sm text-slate-400 mt-1">Automatic error capture and retry logic</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">✓</div>
            </div>
            <div>
              <p className="font-medium text-white">Real-time Logs</p>
              <p className="text-sm text-slate-400 mt-1">View detailed logs for each node execution</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">✓</div>
            </div>
            <div>
              <p className="font-medium text-white">Data Passing</p>
              <p className="text-sm text-slate-400 mt-1">Seamlessly pass data between workflow nodes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard