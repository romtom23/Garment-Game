'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getDesign } from '@/lib/storage'
import { StudioShell } from '@/components/studio/studio-shell'
import { Button } from '@/components/ui/button'
import type { Design } from '@/lib/types'

export default function EditStudioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user, ready } = useAuth()
  const router = useRouter()
  const [design, setDesign] = useState<Design | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (!user) {
      router.replace(`/login?next=/studio/${id}`)
      return
    }
    const found = getDesign(id)
    if (!found || found.ownerId !== user.id) {
      setNotFound(true)
      return
    }
    setDesign(found)
  }, [id, user, ready, router])

  if (notFound) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-secondary/30 px-6 text-center">
        <h1 className="font-heading text-2xl font-bold">Design not found</h1>
        <p className="text-muted-foreground">
          {"This design doesn't exist or isn't yours to edit."}
        </p>
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  if (!design) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary/30">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    )
  }

  return <StudioShell initialDesign={design} />
}
