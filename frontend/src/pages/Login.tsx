import { useEffect } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useAppDispatch, useAppSelector } from '@store/hooks'
import { loginAsync, selectAuthError, selectAuthLoading, selectIsAuthenticated } from '@store/auth.slice'
import { LoginFormData } from '../types/workflow.types'

const Login = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isLoading = useAppSelector(selectAuthLoading)
  const error = useAppSelector(selectAuthError)

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [from, isAuthenticated, navigate])

  const onSubmit = async (values: LoginFormData) => {
    const result = await dispatch(loginAsync(values))
    if (loginAsync.fulfilled.match(result)) {
      navigate(from, { replace: true })
    }
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.22),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <div className="flex flex-1 items-center px-6 py-14 lg:px-16">
          <div className="max-w-xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              <SparklesIcon className="h-4 w-4" />
              Workflow Builder
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Sign in to orchestrate workflows without the clutter.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
                Build automations, trace execution, and keep your operations moving from one focused dashboard.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Secure access', 'JWT-backed sessions and protected routes.'],
                ['Fast iteration', 'Jump back into drafts, runs, and triggers quickly.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-14 lg:px-16">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="mb-8 space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-300">Welcome back</p>
              <h2 className="text-2xl font-semibold text-white">Log in to your workspace</h2>
              <p className="text-sm text-slate-400">Use the account you created during setup.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Email</span>
                <input
                  type="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                  placeholder="you@example.com"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <p className="text-sm text-rose-300">{errors.email.message}</p>}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Password</span>
                <input
                  type="password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                  placeholder="Enter your password"
                  {...register('password', { required: 'Password is required' })}
                />
                {errors.password && <p className="text-sm text-rose-300">{errors.password.message}</p>}
              </label>

              {error && (
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
                {!isLoading && <ArrowRightIcon className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-400">
              No account yet?{' '}
              <Link to="/register" className="font-medium text-amber-300 transition hover:text-amber-200">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login