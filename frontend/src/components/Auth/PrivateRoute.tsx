import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@store/hooks'
import { selectIsAuthenticated } from '@store/auth.slice'

const PrivateRoute = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default PrivateRoute