import axios, { AxiosInstance, AxiosError } from 'axios'
import { ApiResponse, AuthResponse, AuthTokens, AuthUser, ChangePasswordFormData, UpdateProfileFormData } from '../types/workflow.types'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

class ApiClient {
  private api: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor - add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle 401 and refresh token
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
            if (refreshToken) {
              const response = await this.api.post<ApiResponse<AuthResponse>>(
                '/auth/refresh',
                { refreshToken }
              )

              if (response.data.data) {
                localStorage.setItem(ACCESS_TOKEN_KEY, response.data.data.tokens.accessToken)
                localStorage.setItem(REFRESH_TOKEN_KEY, response.data.data.tokens.refreshToken)

                originalRequest.headers.Authorization = `Bearer ${response.data.data.tokens.accessToken}`
                return this.api(originalRequest)
              }
            }
          } catch (refreshError) {
            // Redirect to login
            localStorage.removeItem(ACCESS_TOKEN_KEY)
            localStorage.removeItem(REFRESH_TOKEN_KEY)
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    })
  }

  async register(data: {
    email: string
    username: string
    password: string
    firstName?: string
    lastName?: string
  }) {
    return this.api.post<ApiResponse<AuthResponse>>('/auth/register', data)
  }

  async refreshTokens(refreshToken: string) {
    return this.api.post<ApiResponse<AuthResponse>>('/auth/refresh', {
      refreshToken,
    })
  }

  async getProfile() {
    return this.api.get<ApiResponse<AuthUser>>('/auth/profile')
  }

  async updateProfile(data: UpdateProfileFormData) {
    return this.api.put<ApiResponse<AuthUser>>('/auth/profile', data)
  }

  async changePassword(data: ChangePasswordFormData) {
    return this.api.post<ApiResponse<{ message: string }>>('/auth/change-password', data)
  }

  async logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    return Promise.resolve()
  }

  setAuthTokens(tokens: AuthTokens) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  }

  clearAuthTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  getStoredAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  getStoredRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }
  // Workflow endpoints
  async getWorkflows() {
    return this.api.get('/workflows')
  }

  async getWorkflow(id: string) {
    return this.api.get(`/workflows/${id}`)
  }

  async createWorkflow(data: any) {
    return this.api.post('/workflows', data)
  }

  async updateWorkflow(id: string, data: any) {
    return this.api.put(`/workflows/${id}`, data)
  }

  async deleteWorkflow(id: string) {
    return this.api.delete(`/workflows/${id}`)
  }

  async publishWorkflow(id: string) {
    return this.api.post(`/workflows/${id}/publish`)
  }

  async executeWorkflow(id: string, data?: any) {
    return this.api.post(`/workflows/${id}/execute`, data || {})
  }

  async pauseWorkflow(workflowId: string, runId: string) {
    return this.api.patch(`/workflows/${workflowId}/runs/${runId}/pause`)
  }

  async resumeWorkflow(workflowId: string, runId: string) {
    return this.api.patch(`/workflows/${workflowId}/runs/${runId}/resume`)
  }

  async triggerViaWebhook(workflowId: string, secretKey: string, payload?: any) {
    return this.api.post(`/workflows/${workflowId}/trigger/${secretKey}`, payload || {})
  }

  // Trigger endpoints
  async getTriggers(workflowId: string) {
    return this.api.get(`/triggers?workflowId=${workflowId}`)
  }

  async createTrigger(workflowId: string, data: any) {
    return this.api.post('/triggers', { ...data, workflowId })
  }

  async updateTrigger(id: string, data: any) {
    return this.api.put(`/triggers/${id}`, data)
  }

  async deleteTrigger(id: string) {
    return this.api.delete(`/triggers/${id}`)
  }

  async toggleTrigger(id: string, isActive: boolean) {
    return this.api.post(`/triggers/${id}/toggle`, { isActive })
  }

  // Execution endpoints
  async getExecutionsByWorkflow(workflowId: string, limit = 50, offset = 0) {
    return this.api.get(`/executions/workflow/${workflowId}?limit=${limit}&offset=${offset}`)
  }

  async getExecution(runId: string) {
    return this.api.get(`/executions/${runId}`)
  }

  async createExecution(data: any) {
    return this.api.post('/executions', data)
  }

  async updateExecutionStatus(runId: string, status: string, errorMessage?: string) {
    return this.api.put(`/executions/${runId}/status`, {
      status,
      errorMessage,
    })
  }

  async completeExecution(runId: string, status = 'completed', errorMessage?: string) {
    return this.api.post(`/executions/${runId}/complete`, {
      status,
      errorMessage,
    })
  }

  async pauseExecution(id: string) {
    return this.api.post(`/executions/${id}/pause`)
  }

  async resumeExecution(id: string) {
    return this.api.post(`/executions/${id}/resume`)
  }

  async stopExecution(id: string) {
    return this.api.post(`/executions/${id}/stop`)
  }

  // Monitoring endpoints
  async getExecutionLogs(executionId: string) {
    return this.api.get(`/executions/${executionId}/logs`)
  }

  // Health check
  async healthCheck() {
    return this.api.get('/health')
  }
}

export default new ApiClient()
export const api = new ApiClient()
