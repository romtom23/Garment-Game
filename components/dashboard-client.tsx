'use client'

import { useState, useTransition } from 'react'
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
  Package,
} from 'lucide-react'
import {
  createDesign,
  deleteDesign,
  publishDesign,
} from '@/app/actions/designs'
import { priceDesign, formatUSD } from '@/lib/pricing'
import type { Design, Order } from '@/lib/types'
import { GarmentThumb } from '@/components/garment-thumb'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const STATUS_STYLES: Record<Order['status'], string> = {
  pending: 'bg-muted text-muted-foreground',
  paid: 'bg-primary/15 text-primary',
  fulfilled: 'bg-emerald-500/15 text-emerald-600',
  canceled: 'bg-destructive/10 text-destructive',
}

export function DashboardClient({
  designs,
  orders,
}: {
  designs: Design[]
  orders: Order[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const onCreate = () => {
    startTransition(async () => {
      const d = await createDesign()
      router.push(`/studio/${d.id}`)
    })
  }

  const onDelete = (id: string) => {
    setBusyId(id)
    startTransition(async () => {
      await deleteDesign(id)
      setBusyId(null)
      router.refresh()
      toast.success('Design deleted')
    })
  }

  const onShare = (d: Design) => {
    setBusyId(d.id)
    startTransition(async () => {
      const published = await publishDesign(d.id)
      setBusyId(null)
      router.refresh()
      if (!published.slug) return
      const url = `${window.location.origin}/shop/${published.slug}`
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Shop link copied!')
      } catch {
        toast.success('Shop published!')
      }
    })
  }

  return (
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
        <Button
          onClick={onCreate}
          size="lg"
          className="font-bold shadow-md"
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Plus className="size-5" />
          )}
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
            Sketch a mascot head, shirt, and sweatpants with smooth vector
            shapes, then watch them puff into 3D.
          </span>
        </button>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((d) => {
            const price = priceDesign(d)
            const busy = busyId === d.id && pending
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
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Share2 className="size-4" />
                      )}
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
                      disabled={busy}
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

      <section className="mt-14">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-2xl font-extrabold">Your orders</h2>
          <Button asChild variant="ghost" size="sm" className="font-semibold">
            <Link href="/orders">
              <Package className="size-4" />
              Order tracker
            </Link>
          </Button>
        </div>
        {orders.length === 0 ? (
          <p className="mt-3 rounded-2xl border-2 border-dashed border-border bg-card/60 px-5 py-8 text-center text-sm text-muted-foreground">
            No orders yet. Add a design to your cart and check out to see it
            here.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border-2 border-border bg-card">
            <ul className="divide-y divide-border">
              {orders.slice(0, 5).map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      Order #{o.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()} ·{' '}
                      {o.items.length} item{o.items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${STATUS_STYLES[o.status]}`}
                    >
                      {o.status}
                    </span>
                    <span className="font-bold">
                      {formatUSD(o.amountTotal / 100)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  )
}
