'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { User } from './types'

// NOTE: This is a mock, client-side auth layer backed by localStorage so the
// full product flow works without a backend. It is intentionally isolated
// behind this provider so it can later be swapped for Neon + Better Auth
// (email + password) without touching any consuming components.

type StoredUser = User & { password: string }

type AuthContextValue = {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USERS_KEY = 'loomly:users'
const SESSION_KEY = 'loomly:session'

function readUsers(): StoredUser[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) || '[]')
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {
      // ignore
    }
    setReady(true)
  }, [])

  const persistSession = useCallback((u: User | null) => {
    setUser(u)
    if (u) window.localStorage.setItem(SESSION_KEY, JSON.stringify(u))
    else window.localStorage.removeItem(SESSION_KEY)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      await delay()
      const users = readUsers()
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      )
      if (!found || found.password !== password) {
        throw new Error('Invalid email or password')
      }
      persistSession({ id: found.id, name: found.name, email: found.email })
    },
    [persistSession],
  )

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      await delay()
      const users = readUsers()
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('An account with that email already exists')
      }
      const newUser: StoredUser = { id: uid(), name, email, password }
      writeUsers([...users, newUser])
      persistSession({ id: newUser.id, name, email })
    },
    [persistSession],
  )

  const logout = useCallback(() => persistSession(null), [persistSession])

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, login, signup, logout }),
    [user, ready, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function delay(ms = 450) {
  return new Promise((r) => setTimeout(r, ms))
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
