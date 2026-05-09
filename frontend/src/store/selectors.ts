/**
 * Optimized Redux selectors for better performance
 * Use these instead of regular useSelector to minimize re-renders
 */

import { shallowEqual, useSelector } from 'react-redux'
import { RootState } from './store'

/**
 * Select auth state with memoization
 */
export const useAuthState = () => {
  return useSelector(
    (state: RootState) => ({
      isAuthenticated: state.auth.isAuthenticated,
      user: state.auth.user,
      accessToken: state.auth.accessToken,
      refreshToken: state.auth.refreshToken,
      isLoading: state.auth.isLoading,
      error: state.auth.error,
    }),
    shallowEqual
  )
}

/**
 * Select only auth status
 */
export const useIsAuthenticated = () => {
  return useSelector((state: RootState) => state.auth.isAuthenticated)
}

/**
 * Select only user
 */
export const useAuthUser = () => {
  return useSelector((state: RootState) => state.auth.user)
}

/**
 * Select only auth loading state
 */
export const useAuthLoading = () => {
  return useSelector((state: RootState) => state.auth.isLoading)
}

/**
 * Select only auth error state
 */
export const useAuthError = () => {
  return useSelector((state: RootState) => state.auth.error)
}

/**
 * Select current access token
 */
export const useAccessToken = () => {
  return useSelector((state: RootState) => state.auth.accessToken)
}
