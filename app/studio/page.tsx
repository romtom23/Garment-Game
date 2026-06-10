'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { createDesign } from '@/lib/storage'
import { StudioShell } from '@/components/studio/studio-shell'
import type { Design } from '@/lib/types'

export default function StudioPage() {
  const { user, ready } = useAuth()
  const router = useRouter()
  const [design, setDesign] = useState<Design | null>(null)

  useEffect(() => {
    if (!ready) return
    if (!user) {
      router.replace('/login?next=/studio')
      return
    }
    setDesign(createDesign(user.id))
  }, [user, ready, router])

  if (!design) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary/30">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    )
  }

  return <StudioShell initialDesign={design} />
}
