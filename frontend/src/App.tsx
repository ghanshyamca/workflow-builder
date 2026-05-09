import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from '@store/hooks'
import { selectIsAuthenticated } from '@store/auth.slice'
import PrivateRoute from './components/Auth/PrivateRoute'
import MainLayout from './components/Layout/MainLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import './styles/index.css'

// Lazy load route components for code splitting
const Dashboard = lazy(() => import('@pages/Dashboard'))
const WorkflowList = lazy(() => import('@pages/WorkflowList'))
const WorkflowBuilder = lazy(() => import('@pages/WorkflowBuilder'))
const ExecutionHistory = lazy(() => import('@pages/ExecutionHistory'))
const ExecutionDetail = lazy(() => import('@pages/ExecutionDetail'))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
)

const App: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />

          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/workflows" element={<WorkflowList />} />
              <Route path="/workflows/:id" element={<WorkflowBuilder />} />
              <Route path="/workflows/:workflowId/executions" element={<ExecutionHistory />} />
              <Route path="/workflows/:workflowId/executions/:runId" element={<ExecutionDetail />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
