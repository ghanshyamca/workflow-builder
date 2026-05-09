// Workflow Types
export interface Node {
  id: string
  name: string
  type: 'http_request' | 'condition' | 'delay' | 'notify'
  config: Record<string, any>
  position?: { x: number; y: number }
  connections?: string[] // IDs of connected nodes
}

export interface Workflow {
  id: string
  name: string
  description?: string
  status: 'draft' | 'published'
  nodes: Node[]
  triggers: Trigger[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

// Trigger Types
export interface Trigger {
  id: string
  workflowId: string
  type: 'webhook' | 'schedule'
  isActive: boolean
  webhookUrl?: string
  webhookSecret?: string
  cronExpression?: string
  timezone?: string
  lastTriggeredAt?: string
  createdAt: string
  updatedAt: string
}

// Execution Types
export interface NodeExecution {
  id: string
  nodeId: string
  nodeName: string
  nodeType: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  inputData?: Record<string, any>
  outputData?: Record<string, any>
  errorMessage?: string
  startTime?: string
  endTime?: string
  durationMs?: number
  retryCount: number
  createdAt: string
}

export interface WorkflowRun {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  startTime: string
  endTime?: string
  durationMs?: number
  errorMessage?: string
  nodeExecutions: NodeExecution[]
  executionData?: Record<string, any>
  createdAt: string
}

// User Types
export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  profilePictureUrl?: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export interface AuthUser {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  profilePictureUrl?: string
  isActive?: boolean
  createdAt?: string
  lastLogin?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

export interface AuthResponse {
  user: AuthUser
  tokens: AuthTokens
}

// API Response Types
export interface ApiResponse<T> {
  status: 'success' | 'error'
  message?: string
  data?: T
  errors?: Array<{
    field: string
    message: string
  }>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  firstName?: string
  lastName?: string
}

export interface UpdateProfileFormData {
  firstName?: string
  lastName?: string
}

export interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface WorkflowFormData {
  name: string
  description?: string
  nodes: Node[]
  triggers: Trigger[]
}
