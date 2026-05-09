import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from '@store/hooks'
import { selectIsAuthenticated } from '@store/auth.slice'
import PrivateRoute from './components/Auth/PrivateRoute'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import WorkflowList from '@pages/WorkflowList'
import WorkflowBuilder from '@pages/WorkflowBuilder'
import { ExecutionHistory } from './pages/ExecutionHistory'
import { ExecutionDetail } from './pages/ExecutionDetail'
import './styles/index.css'

const App: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  return (
    <Router>
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
    </Router>
  )
}

export default App
