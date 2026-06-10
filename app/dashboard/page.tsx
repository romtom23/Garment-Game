'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Loader2,
  Trash2,
  ExternalLink,
  Pencil,
  Share2,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import {
  listDesigns,
  createDesign,
  deleteDesign,
  publishDesign,
} from '@/lib/storage'
import { priceDesign, formatUSD } from '@/lib/pricing'
import type { Design } from '@/lib/types'
import { SiteHeader } from '@/components/site-header'
import { GarmentThumb } from '@/components/garment-thumb'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { user, ready } = useAuth()
  const router = useRouter()
  const [designs, setDesigns] = useState<Design[] | null>(null)

  const refresh = useCallback(() => {
    if (user) setDesigns(listDesigns(user.id))
  }, [user])

  useEffect(() => {
    if (!ready) return
    if (!user) {
      router.replace('/login?next=/dashboard')
      return
    }
    refresh()
  }, [user, ready, router, refresh])

  const onCreate = () => {
    if (!user) return
    const d = createDesign(user.id)
    router.push(`/studio/${d.id}`)
  }

  const onDelete = (id: string) => {
    deleteDesign(id)
    refresh()
    toast.success('Design deleted')
  }

  const onShare = async (d: Design) => {
    const published = d.published ? d : publishDesign(d.id)
    if (!published?.slug) return
    refresh()
    const url = `${window.location.origin}/shop/${published.slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Shop link copied!')
    } catch {
      toast.success('Shop published!')
    }
  }

  if (!ready || !designs) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary/30">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">
              Your studio
            </h1>
            <p className="mt-1 text-muted-foreground">
              {designs.length
                ? `${designs.length} design${designs.length > 1 ? 's' : ''} in progress`
                : 'Make your first design to get started.'}
            </p>
          </div>
          <Button onClick={onCreate} size="lg" className="font-bold shadow-md">
            <Plus className="size-5" />
            New design
          </Button>
        </div>

        {designs.length === 0 ? (
          <button
            onClick={onCreate}
            className="mt-10 flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card/60 px-6 py-20 text-center transition-colors hover:border-primary/60 hover:bg-card"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="size-7" />
            </span>
            <span className="font-heading text-xl font-bold">
              Start your first drop
            </span>
            <span className="max-w-xs text-sm text-muted-foreground">
              Doodle a mascot head, shirt, and sweatpants, then watch them puff
              into 3D.
            </span>
          </button>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {designs.map((d) => {
              const price = priceDesign(d)
              return (
                <div
                  key={d.id}
                  className="flex flex-col overflow-hidden rounded-3xl border-2 border-border bg-card shadow-sm"
                >
                  <Link
                    href={`/studio/${d.id}`}
                    className="grid grid-cols-3 gap-1 bg-secondary/30 p-4"
                  >
                    {d.layers.map((l) => (
                      <div
                        key={l.garment}
                        className="flex aspect-square items-center justify-center rounded-2xl bg-card"
                      >
                        <GarmentThumb layer={l} size={92} />
                      </div>
                    ))}
                  </Link>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-heading text-lg font-bold">
                        {d.title}
                      </h3>
                      {d.published && (
                        <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                          Published
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
                      Bundle {formatUSD(price.total)}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="flex-1 font-semibold"
                      >
                        <Link href={`/studio/${d.id}`}>
                          <Pencil className="size-4" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 font-semibold"
                        onClick={() => onShare(d)}
                      >
                        <Share2 className="size-4" />
                        Share
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {d.published && d.slug && (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="flex-1 font-semibold"
                        >
                          <Link href={`/shop/${d.slug}`}>
                            <ExternalLink className="size-4" />
                            View shop
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Delete design"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(d.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
