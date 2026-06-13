'use client'

import { authClient } from '@/lib/auth-client'
import type { User } from '@/lib/types'

/**
 * Thin client-side wrapper around Better Auth's session hook so existing
 * components keep a familiar `{ user, ready, logout }` shape. Real accounts are
 * stored in Neon Postgres and authenticated with email + password.
 */
export function useAuth() {
  const { data, isPending } = authClient.useSession()
  const user: User | null = data?.user
    ? { id: data.user.id, name: data.user.name, email: data.user.email }
    : null
  return {
    user,
    ready: !isPending,
    logout: () => authClient.signOut(),
  }
}
