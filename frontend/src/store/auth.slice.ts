import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import api from '../services/api'
import {
  AuthTokens,
  AuthUser,
  ChangePasswordFormData,
  LoginFormData,
  RegisterFormData,
  UpdateProfileFormData,
} from '../types/workflow.types'

const STORAGE_KEYS = {
  user: 'authUser',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
} as const

const readStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

const storeSession = (user: AuthUser, tokens: AuthTokens) => {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
  api.setAuthTokens(tokens)
}

const clearSession = () => {
  localStorage.removeItem(STORAGE_KEYS.user)
  api.clearAuthTokens()
}

export interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: readStoredUser(),
  accessToken: api.getStoredAccessToken(),
  refreshToken: api.getStoredRefreshToken(),
  isAuthenticated: Boolean(api.getStoredAccessToken()),
  isLoading: false,
  error: null,
}

export const loginAsync = createAsyncThunk(
  'auth/login',
  async (values: LoginFormData, { rejectWithValue }) => {
    try {
      const response = await api.login(values.email, values.password)
      return response.data.data
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Login failed'
      return rejectWithValue(message)
    }
  }
)

export const registerAsync = createAsyncThunk(
  'auth/register',
  async (values: RegisterFormData, { rejectWithValue }) => {
    try {
      const { confirmPassword, ...payload } = values
      const response = await api.register(payload)
      return response.data.data
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Registration failed'
      return rejectWithValue(message)
    }
  }
)

export const refreshAsync = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = api.getStoredRefreshToken()
      if (!refreshToken) {
        return rejectWithValue('Missing refresh token')
      }

      const response = await api.refreshTokens(refreshToken)
      return response.data.data
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Session refresh failed'
      return rejectWithValue(message)
    }
  }
)

export const loadProfileAsync = createAsyncThunk(
  'auth/loadProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getProfile()
      return response.data.data
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to load profile'
      return rejectWithValue(message)
    }
  }
)

export const updateProfileAsync = createAsyncThunk(
  'auth/updateProfile',
  async (values: UpdateProfileFormData, { rejectWithValue }) => {
    try {
      const response = await api.updateProfile(values)
      return response.data.data
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Profile update failed'
      return rejectWithValue(message)
    }
  }
)

export const changePasswordAsync = createAsyncThunk(
  'auth/changePassword',
  async (values: ChangePasswordFormData, { rejectWithValue }) => {
    try {
      const response = await api.changePassword(values)
      return response.data.data
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Password change failed'
      return rejectWithValue(message)
    }
  }
)

export const logoutAsync = createAsyncThunk('auth/logout', async () => {
  await api.logout()
  clearSession()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: AuthUser; tokens: AuthTokens }>) => {
      state.user = action.payload.user
      state.accessToken = action.payload.tokens.accessToken
      state.refreshToken = action.payload.tokens.refreshToken
      state.isAuthenticated = true
      state.error = null

      storeSession(action.payload.user, action.payload.tokens)
    },
    clearAuthState: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      clearSession()
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload?.user ?? null
        state.accessToken = action.payload?.tokens.accessToken ?? null
        state.refreshToken = action.payload?.tokens.refreshToken ?? null
        state.isAuthenticated = true
        state.error = null

        if (action.payload?.user && action.payload?.tokens) {
          storeSession(action.payload.user, action.payload.tokens)
        }
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || action.error.message || 'Login failed'
      })
      .addCase(registerAsync.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerAsync.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload?.user ?? null
        state.accessToken = action.payload?.tokens.accessToken ?? null
        state.refreshToken = action.payload?.tokens.refreshToken ?? null
        state.isAuthenticated = true
        state.error = null

        if (action.payload?.user && action.payload?.tokens) {
          storeSession(action.payload.user, action.payload.tokens)
        }
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || action.error.message || 'Registration failed'
      })
      .addCase(refreshAsync.fulfilled, (state, action) => {
        state.user = action.payload?.user ?? state.user
        state.accessToken = action.payload?.tokens.accessToken ?? state.accessToken
        state.refreshToken = action.payload?.tokens.refreshToken ?? state.refreshToken
        state.isAuthenticated = Boolean(action.payload?.tokens.accessToken || state.accessToken)

        if (action.payload?.user && action.payload?.tokens) {
          storeSession(action.payload.user, action.payload.tokens)
        }
      })
      .addCase(refreshAsync.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || 'Session refresh failed'
      })
      .addCase(loadProfileAsync.fulfilled, (state, action) => {
        state.user = action.payload ?? state.user

        if (action.payload) {
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(action.payload))
        }
      })
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        state.user = action.payload ?? state.user

        if (action.payload) {
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(action.payload))
        }
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.error = null
      })
  },
})

export const { setCredentials, clearAuthState } = authSlice.actions

export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated

export default authSlice.reducer