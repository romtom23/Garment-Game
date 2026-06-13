'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shirt, ShoppingBag, Check, Factory, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Design, DesignLayer } from '@/lib/types'
import { GARMENT_LABEL, stylesFor } from '@/lib/garments'
import { priceDesign, formatUSD, type GarmentPrice } from '@/lib/pricing'
import { addToCart } from '@/app/actions/cart'
import { GarmentThumb } from '@/components/garment-thumb'
import { Button } from '@/components/ui/button'

function variantName(layer: DesignLayer) {
  return (
    stylesFor(layer.garment).find((s) => s.variant === layer.variant)?.name ??
    layer.variant
  )
}

export function ShopClient({
  design,
  signedIn,
}: {
  design: Design | null
  signedIn: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [addingGarment, setAddingGarment] = useState<string | null>(null)
  const [added, setAdded] = useState<Record<string, boolean>>({})

  const price = useMemo(() => (design ? priceDesign(design) : null), [design])

  const priceByGarment = useMemo(() => {
    const m = new Map<string, GarmentPrice>()
    price?.perGarment.forEach((g) => m.set(g.garment, g))
    return m
  }, [price])

  if (!design || !price) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-secondary/30 px-6 text-center">
        <h1 className="font-heading text-2xl font-bold">Shop not found</h1>
        <p className="max-w-sm text-muted-foreground">
          This shop link may not exist yet, or the design hasn&apos;t been
          published.
        </p>
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
      </div>
    )
  }

  const handleAdd = (layer: DesignLayer) => {
    if (!signedIn) {
      router.push(`/login?next=/shop/${design.slug}`)
      return
    }
    setAddingGarment(layer.garment)
    startTransition(async () => {
      try {
        await addToCart({
          designId: design.id,
          designTitle: design.title,
          layer,
        })
        setAdded((a) => ({ ...a, [layer.garment]: true }))
        toast.success(`${GARMENT_LABEL[layer.garment]} added to cart`)
      } catch {
        toast.error('Could not add to cart')
      } finally {
        setAddingGarment(null)
      }
    })
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
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="font-semibold">
              <Link href="/cart">
                <ShoppingBag className="size-4" />
                Cart
              </Link>
            </Button>
          </div>
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
            const isAdded = !!added[layer.garment]
            const busy = addingGarment === layer.garment && pending
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
                    variant={isAdded ? 'secondary' : 'default'}
                    className="mt-4 font-semibold"
                    onClick={() => handleAdd(layer)}
                    disabled={busy}
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : isAdded ? (
                      <>
                        <Check className="size-4" />
                        Added — add another
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="size-4" />
                        Add to cart
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mx-auto mt-10 max-w-md rounded-3xl border-2 border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Full bundle{' '}
            <span className="font-heading text-xl font-extrabold text-foreground">
              {formatUSD(price.total)}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            You&apos;d normally pay around{' '}
            <span className="font-semibold line-through">
              {formatUSD(price.retailComparison)}
            </span>{' '}
            for a comparable custom bundle.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-4 w-full font-bold shadow-md"
          >
            <Link href="/cart">
              <ShoppingBag className="size-5" />
              Go to cart &amp; checkout
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
