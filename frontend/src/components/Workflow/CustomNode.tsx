import React from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

type CustomNodeData = {
  label: string
  nodeType: string
  color: string
  status?: 'running' | 'completed' | 'failed' | 'pending'
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  const status = data.status || 'pending'
  
  const getStatusStyles = () => {
    switch (status) {
      case 'running':
        return {
          borderColor: '#3b82f6',
          borderWidth: '2px',
          boxShadow: '0 0 12px rgba(59, 130, 246, 0.5), inset 0 0 12px rgba(59, 130, 246, 0.1)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }
      case 'completed':
        return {
          borderColor: '#10b981',
          borderWidth: '2px',
          boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)',
        }
      case 'failed':
        return {
          borderColor: '#ef4444',
          borderWidth: '2px',
          boxShadow: '0 0 8px rgba(239, 68, 68, 0.3)',
        }
      default:
        return {
          borderColor: `${data.color}88`,
          borderWidth: selected ? '2px' : '1px',
        }
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return (
          <div className="absolute -right-2 -top-2 h-4 w-4 bg-blue-400 rounded-full animate-pulse border-2 border-blue-500">
            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
          </div>
        )
      case 'completed':
        return (
          <div className="absolute -right-2 -top-2 h-4 w-4 bg-green-400 rounded-full flex items-center justify-center border-2 border-green-500 text-white text-xs font-bold">
            ✓
          </div>
        )
      case 'failed':
        return (
          <div className="absolute -right-2 -top-2 h-4 w-4 bg-red-400 rounded-full flex items-center justify-center border-2 border-red-500 text-white text-xs font-bold">
            ✕
          </div>
        )
      default:
        return null
    }
  }

  const getStatusBadge = () => {
    if (status === 'pending') return null
    
    const statusConfig = {
      running: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Running' },
      completed: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Done' },
      failed: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Failed' },
    }

    const config = statusConfig[status]
    
    return (
      <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded text-xs font-semibold ${config.bg} ${config.text} whitespace-nowrap`}>
        {config.label}
      </div>
    )
  }

  return (
    <div className="relative overflow-visible">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
      <div
        className="relative z-10 min-w-[170px] overflow-visible rounded-xl px-3 py-2 shadow-md transition-all duration-300"
        style={{
          ...getStatusStyles(),
          background: 'linear-gradient(145deg, #0f172a, #111827)',
        }}
      >
        {getStatusIcon()}
        <Handle type="target" position={Position.Top} style={{ zIndex: 20 }} />
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{data.nodeType}</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">{data.label}</p>
        <Handle type="source" position={Position.Bottom} style={{ zIndex: 20 }} />
      </div>
      {getStatusBadge()}
    </div>
  )
}

export default CustomNode
