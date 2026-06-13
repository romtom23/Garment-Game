'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import type { CartItem } from '@/lib/types'
import { GARMENT_LABEL, stylesFor } from '@/lib/garments'
import { formatUSD } from '@/lib/pricing'
import { updateCartQty, removeFromCart } from '@/app/actions/cart'
import { finalizeOrder } from '@/app/actions/checkout'
import { GarmentThumb } from '@/components/garment-thumb'
import { Button } from '@/components/ui/button'
import { CheckoutEmbed } from '@/components/checkout-embed'

function variantName(item: CartItem) {
  return (
    stylesFor(item.garment).find((s) => s.variant === item.variant)?.name ??
    item.variant
  )
}

export function CartClient({ items }: { items: CartItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [phase, setPhase] = useState<'cart' | 'checkout' | 'done'>('cart')

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.unitPrice * it.qty, 0),
    [items],
  )

  const setQty = (id: number, qty: number) => {
    startTransition(async () => {
      await updateCartQty(id, qty)
      router.refresh()
    })
  }

  const remove = (id: number) => {
    startTransition(async () => {
      await removeFromCart(id)
      router.refresh()
      toast.success('Removed from cart')
    })
  }

  const onCheckoutComplete = () => {
    startTransition(async () => {
      const result = await finalizeOrder()
      if (result.status === 'paid') {
        setPhase('done')
        router.refresh()
      } else {
        toast.error('Payment not confirmed yet. Please try again.')
        setPhase('cart')
      }
    })
  }

  if (phase === 'done') {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className="font-heading text-3xl font-extrabold">Order placed!</h1>
        <p className="text-muted-foreground">
          Your custom pieces are headed to our partner factory. You can track
          this order from your dashboard.
        </p>
        <div className="mt-2 flex gap-3">
          <Button asChild variant="secondary" className="font-semibold">
            <Link href="/orders">Track order</Link>
          </Button>
          <Button asChild className="font-semibold">
            <Link href="/dashboard">Back to studio</Link>
          </Button>
        </div>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <ShoppingBag className="size-9" />
        </span>
        <h1 className="font-heading text-2xl font-extrabold">
          Your cart is empty
        </h1>
        <p className="text-muted-foreground">
          Design a piece in the studio or browse a published shop to add items.
        </p>
        <Button asChild className="mt-2 font-semibold">
          <Link href="/dashboard">Go to my studio</Link>
        </Button>
      </main>
    )
  }

  if (phase === 'checkout') {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <Button
          variant="ghost"
          className="mb-4 font-semibold"
          onClick={() => setPhase('cart')}
        >
          <ArrowLeft className="size-4" />
          Back to cart
        </Button>
        <h1 className="mb-4 font-heading text-2xl font-extrabold">Checkout</h1>
        <CheckoutEmbed onComplete={onCheckoutComplete} />
        {pending && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Confirming your order…
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">
        Your cart
      </h1>
      <p className="mt-1 text-muted-foreground">
        {items.length} item{items.length > 1 ? 's' : ''} ready to make
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="flex flex-col gap-4">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex gap-4 rounded-3xl border-2 border-border bg-card p-4 shadow-sm"
            >
              <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-secondary/40">
                <GarmentThumb layer={it.layer} size={84} />
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading text-lg font-bold leading-tight">
                      {it.designTitle}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {GARMENT_LABEL[it.garment]} · {variantName(it)}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(it.id)}
                    disabled={pending}
                    aria-label="Remove item"
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center gap-1 rounded-full border-2 border-border p-1">
                    <button
                      onClick={() => setQty(it.id, it.qty - 1)}
                      disabled={pending}
                      aria-label="Decrease quantity"
                      className="flex size-7 items-center justify-center rounded-full hover:bg-secondary"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">
                      {it.qty}
                    </span>
                    <button
                      onClick={() => setQty(it.id, it.qty + 1)}
                      disabled={pending}
                      aria-label="Increase quantity"
                      className="flex size-7 items-center justify-center rounded-full hover:bg-secondary"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <span className="font-heading text-lg font-extrabold">
                    {formatUSD((it.unitPrice * it.qty) / 100)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl border-2 border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-xl font-bold">Order summary</h2>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold">{formatUSD(subtotal / 100)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-semibold">Calculated at checkout</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <span className="font-bold">Total</span>
            <span className="font-heading text-xl font-extrabold">
              {formatUSD(subtotal / 100)}
            </span>
          </div>
          <Button
            size="lg"
            className="mt-5 w-full font-bold shadow-md"
            onClick={() => setPhase('checkout')}
            disabled={pending}
          >
            <ShoppingBag className="size-5" />
            Checkout
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Secure payment, billing &amp; shipping handled by Stripe.
          </p>
        </aside>
      </div>
    </main>
  )
}
