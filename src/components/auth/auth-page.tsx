import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'

export function AuthPage() {
  const { signIn, signUp, isLoading } = useAuthStore()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (isSignUp) {
      if (!name.trim()) {
        setError('Please enter your name')
        return
      }
      const { error } = await signUp(email, password, name)
      if (error) {
        setError(error)
      } else {
        setSuccess('Account created! Check your email to verify.')
      }
    } else {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[300px] -top-[300px] h-[600px] w-[600px] rounded-full bg-violet-500/5 blur-3xl" />
        <div className="absolute -bottom-[200px] -right-[200px] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/3 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] px-4">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-violet-500/25">
            G
          </div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? 'Start building your workspace'
              : 'Sign in to your Gawean workspace'}
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 shadow-xl shadow-black/5 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">
                  Full name
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 bg-background/50 transition-shadow focus:shadow-md focus:shadow-violet-500/5"
                  required={isSignUp}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">
                Email address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 bg-background/50 transition-shadow focus:shadow-md focus:shadow-violet-500/5"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 bg-background/50 pr-10 transition-shadow focus:shadow-md focus:shadow-violet-500/5"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500 animate-in fade-in slide-in-from-top-1 duration-200">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="h-10 w-full bg-gradient-to-r from-violet-600 to-indigo-600 font-medium text-white shadow-md shadow-violet-500/20 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-500/30"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {isSignUp ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setSuccess(null)
              }}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* Skip Auth (Dev mode) */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              // Skip auth for development — go directly to workspace
              window.location.reload()
            }}
            className="text-xs text-muted-foreground/40 transition-colors hover:text-muted-foreground"
          >
            Continue without signing in →
          </button>
        </div>
      </div>
    </div>
  )
}
