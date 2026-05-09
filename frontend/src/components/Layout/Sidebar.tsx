import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRightStartOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useAppDispatch, useAppSelector } from '@store/hooks'
import { logoutAsync, selectAuthUser } from '@store/auth.slice'

const Sidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectAuthUser)

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const handleLogout = async () => {
    await dispatch(logoutAsync())
    navigate('/login', { replace: true })
  }

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Workflows', path: '/workflows', icon: '⚙️' },
  ]

  return (
    <div className="w-64 bg-slate-950/80 border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">Workflow Builder</h1>
        <p className="text-xs text-slate-400 mt-1">Automation Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-slate-400">Signed in as</p>
          <p className="text-sm font-medium text-white truncate mt-1">
            {user?.firstName || user?.username || 'User'}
          </p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition text-sm"
            title="Settings"
          >
            <Cog6ToothIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition text-sm"
            title="Sign out"
          >
            <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
