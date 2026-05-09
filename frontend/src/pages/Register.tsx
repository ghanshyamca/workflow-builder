import { useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useAppDispatch, useAppSelector } from '@store/hooks'
import { registerAsync, selectAuthError, selectAuthLoading, selectIsAuthenticated } from '@store/auth.slice'
import { RegisterFormData } from '../types/workflow.types'

const Register = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isLoading = useAppSelector(selectAuthLoading)
  const error = useAppSelector(selectAuthError)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  })

  const passwordValue = watch('password')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const onSubmit = async (values: RegisterFormData) => {
    const result = await dispatch(registerAsync(values))
    if (registerAsync.fulfilled.match(result)) {
      navigate('/dashboard', { replace: true })
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.2),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(20,184,166,0.16),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#111827_55%,_#0f172a_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <div className="flex flex-1 items-center px-6 py-14 lg:px-16">
          <div className="max-w-xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
              <SparklesIcon className="h-4 w-4" />
              Create your workspace
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Start with one account, then grow into a real workflow system.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
                Register once, and the platform keeps your automation drafts, runs, and monitoring in one place.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="grid gap-3 sm:grid-cols-3">
                {['Sign up', 'Verify', 'Build'].map((step, index) => (
                  <div key={step} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">0{index + 1}</p>
                    <p className="mt-2 text-sm font-medium text-white">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-14 lg:px-16">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="mb-8 space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-300">Create account</p>
              <h2 className="text-2xl font-semibold text-white">Join Workflow Builder</h2>
              <p className="text-sm text-slate-400">Set up your account in under a minute.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">First name</span>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                    placeholder="Jane"
                    {...register('firstName')}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">Last name</span>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                    placeholder="Doe"
                    {...register('lastName')}
                  />
                </label>
              </div>

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
                <span className="text-sm font-medium text-slate-200">Username</span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                  placeholder="workflow_ace"
                  {...register('username', {
                    required: 'Username is required',
                    minLength: { value: 3, message: 'Username must be at least 3 characters' },
                  })}
                />
                {errors.username && <p className="text-sm text-rose-300">{errors.username.message}</p>}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Password</span>
                <input
                  type="password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                  placeholder="Create a strong password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                />
                {errors.password && <p className="text-sm text-rose-300">{errors.password.message}</p>}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Confirm password</span>
                <input
                  type="password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                  placeholder="Repeat your password"
                  {...register('confirmPassword', {
                    required: 'Confirm your password',
                    validate: (value) => value === passwordValue || 'Passwords do not match',
                  })}
                />
                {errors.confirmPassword && <p className="text-sm text-rose-300">{errors.confirmPassword.message}</p>}
              </label>

              {error && (
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
                {!isLoading && <ArrowRightIcon className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-emerald-300 transition hover:text-emerald-200">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register