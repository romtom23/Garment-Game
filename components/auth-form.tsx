'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Shirt } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const { login, signup } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/dashboard'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isSignup) await signup(name, email, password)
      else await login(email, password)
      router.push(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-secondary/30 px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Shirt className="size-5" />
        </span>
        <span className="font-heading text-2xl font-extrabold">Loomly</span>
      </Link>

      <div className="w-full max-w-sm rounded-3xl border-2 border-border bg-card p-7 shadow-lg">
        <h1 className="font-heading text-2xl font-extrabold">
          {isSignup ? 'Create your studio' : 'Welcome back'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSignup
            ? 'Start doodling clothes in seconds.'
            : 'Log in to keep designing.'}
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          {isSignup && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Robin Maker"
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="mt-1 font-bold">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {isSignup ? 'Create account' : 'Log in'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            href={isSignup ? '/login' : '/signup'}
            className="font-bold text-primary hover:underline"
          >
            {isSignup ? 'Log in' : 'Sign up'}
          </Link>
        </p>
      </div>
    </div>
  )
}
