'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Shirt, ShoppingBag, Check, Factory } from 'lucide-react'
import type { Design, DesignLayer } from '@/lib/types'
import { getDesignBySlug } from '@/lib/storage'
import { GARMENT_LABEL, stylesFor } from '@/lib/garments'
import { priceDesign, formatUSD, type GarmentPrice } from '@/lib/pricing'
import { GarmentThumb } from '@/components/garment-thumb'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

function variantName(layer: DesignLayer) {
  return (
    stylesFor(layer.garment).find((s) => s.variant === layer.variant)?.name ??
    layer.variant
  )
}

export function ShopClient({ slug }: { slug: string }) {
  const [design, setDesign] = useState<Design | null>(null)
  const [status, setStatus] = useState<'loading' | 'found' | 'missing'>(
    'loading',
  )
  const [cart, setCart] = useState<Record<string, boolean>>({})
  const [checkout, setCheckout] = useState(false)
  const [ordered, setOrdered] = useState(false)

  useEffect(() => {
    const found = getDesignBySlug(slug)
    if (found) {
      setDesign(found)
      setCart(Object.fromEntries(found.layers.map((l) => [l.garment, true])))
      setStatus('found')
    } else {
      setStatus('missing')
    }
  }, [slug])

  const price = useMemo(() => (design ? priceDesign(design) : null), [design])

  const priceByGarment = useMemo(() => {
    const m = new Map<string, GarmentPrice>()
    price?.perGarment.forEach((g) => m.set(g.garment, g))
    return m
  }, [price])

  const cartTotal = useMemo(() => {
    if (!design || !price) return 0
    return design.layers.reduce((sum, l) => {
      if (!cart[l.garment]) return sum
      return sum + (priceByGarment.get(l.garment)?.total ?? 0)
    }, 0)
  }, [design, price, cart, priceByGarment])

  const selectedCount = Object.values(cart).filter(Boolean).length

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary/30">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    )
  }

  if (status === 'missing' || !design || !price) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-secondary/30 px-6 text-center">
        <h1 className="font-heading text-2xl font-bold">Shop not found</h1>
        <p className="max-w-sm text-muted-foreground">
          This shop link may not exist yet, or it was created in a different
          browser. Designs are saved locally in this demo.
        </p>
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Shirt className="size-5" />
            </span>
            <span className="font-heading text-xl font-extrabold">Loomly</span>
          </Link>
          <span className="text-sm font-semibold text-muted-foreground">
            Designer shop
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-bold">
            <Factory className="size-4 text-primary" />
            Made to order by partner factories
          </span>
          <h1 className="mt-4 text-balance font-heading text-3xl font-extrabold sm:text-4xl">
            {design.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            A custom drop designed in Loomly. Pick your pieces below.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {design.layers.map((layer) => {
            const gp = priceByGarment.get(layer.garment)
            const inCart = !!cart[layer.garment]
            return (
              <div
                key={layer.garment}
                className="flex flex-col overflow-hidden rounded-3xl border-2 border-border bg-card shadow-sm"
              >
                <div className="flex items-center justify-center bg-secondary/30 p-6">
                  <GarmentThumb layer={layer} size={200} />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-heading text-lg font-bold">
                    {GARMENT_LABEL[layer.garment]}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {variantName(layer)} style
                  </p>
                  <p className="mt-2 font-heading text-2xl font-extrabold">
                    {formatUSD(gp?.total ?? 0)}
                  </p>
                  <Button
                    variant={inCart ? 'secondary' : 'default'}
                    className="mt-4 font-semibold"
                    onClick={() =>
                      setCart((c) => ({
                        ...c,
                        [layer.garment]: !c[layer.garment],
                      }))
                    }
                  >
                    {inCart ? (
                      <>
                        <Check className="size-4" />
                        Added
                      </>
                    ) : (
                      'Add to order'
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mx-auto mt-10 max-w-md rounded-3xl border-2 border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">
              {selectedCount} item{selectedCount === 1 ? '' : 's'} selected
            </span>
            <span className="font-heading text-2xl font-extrabold">
              {formatUSD(cartTotal)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            You&apos;d normally pay around{' '}
            <span className="font-semibold line-through">
              {formatUSD(price.retailComparison)}
            </span>{' '}
            for a comparable custom bundle.
          </p>
          <Button
            size="lg"
            className="mt-4 w-full font-bold shadow-md"
            disabled={selectedCount === 0}
            onClick={() => setCheckout(true)}
          >
            <ShoppingBag className="size-5" />
            Checkout
          </Button>
        </div>
      </main>

      <Dialog open={checkout} onOpenChange={setCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {ordered ? 'Order placed!' : 'Confirm your order'}
            </DialogTitle>
            <DialogDescription>
              {ordered
                ? 'This is a demo, so no payment was taken — but in the real thing your design would head to a partner factory now.'
                : `${selectedCount} item${
                    selectedCount === 1 ? '' : 's'
                  } for ${formatUSD(cartTotal)}, made to order.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {ordered ? (
              <Button
                onClick={() => {
                  setCheckout(false)
                  setOrdered(false)
                }}
                className="font-semibold"
              >
                Done
              </Button>
            ) : (
              <Button onClick={() => setOrdered(true)} className="font-semibold">
                <Check className="size-4" />
                Place demo order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
