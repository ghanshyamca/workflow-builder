import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto ml-64">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainLayout
