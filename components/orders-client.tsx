'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  MapPin,
  User,
  Mail,
  CreditCard,
  ChevronDown,
} from 'lucide-react'
import type { Order, OrderStatus } from '@/lib/types'
import { GARMENT_LABEL, stylesFor } from '@/lib/garments'
import { formatUSD } from '@/lib/pricing'
import { setOrderStatus } from '@/app/actions/orders'
import { GarmentThumb } from '@/components/garment-thumb'

const STATUSES: OrderStatus[] = ['paid', 'fulfilled', 'canceled']

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  paid: 'bg-primary/15 text-primary',
  fulfilled: 'bg-emerald-500/15 text-emerald-600',
  canceled: 'bg-destructive/10 text-destructive',
}

function variantName(garment: Order['items'][number]['garment'], variant: string) {
  return stylesFor(garment).find((s) => s.variant === variant)?.name ?? variant
}

export function OrdersClient({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [openId, setOpenId] = useState<string | null>(orders[0]?.id ?? null)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')

  const filtered = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  )

  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'canceled')
        .reduce((s, o) => s + o.amountTotal, 0),
    [orders],
  )

  const changeStatus = (id: string, status: OrderStatus) => {
    startTransition(async () => {
      await setOrderStatus(id, status)
      router.refresh()
    })
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">
            Order tracker
          </h1>
          <p className="mt-1 text-muted-foreground">
            Every paid order, who placed it, where it ships, and what to make.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card px-5 py-3 text-right shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Revenue
          </p>
          <p className="font-heading text-2xl font-extrabold">
            {formatUSD(revenue / 100)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(['all', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={
              'rounded-full px-4 py-1.5 text-sm font-bold capitalize transition-colors ' +
              (filter === s
                ? 'bg-foreground text-background'
                : 'bg-card text-muted-foreground hover:text-foreground')
            }
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card/60 px-6 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Package className="size-7" />
          </span>
          <p className="font-heading text-xl font-bold">No orders yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            When customers check out, their orders will appear here with full
            shipping and product details.
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {filtered.map((o) => {
            const open = openId === o.id
            return (
              <li
                key={o.id}
                className="overflow-hidden rounded-3xl border-2 border-border bg-card shadow-sm"
              >
                <button
                  onClick={() => setOpenId(open ? null : o.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-lg font-bold">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${STATUS_STYLES[o.status]}`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {o.customerName ?? 'Customer'} ·{' '}
                      {new Date(o.createdAt).toLocaleDateString()} ·{' '}
                      {o.items.length} item{o.items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading text-lg font-extrabold">
                      {formatUSD(o.amountTotal / 100)}
                    </span>
                    <ChevronDown
                      className={
                        'size-5 text-muted-foreground transition-transform ' +
                        (open ? 'rotate-180' : '')
                      }
                    />
                  </div>
                </button>

                {open && (
                  <div className="border-t border-border px-5 py-5">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Customer + shipping */}
                      <div className="flex flex-col gap-4">
                        <section>
                          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                            <User className="size-4 text-primary" />
                            Customer
                          </h3>
                          <p className="text-sm font-semibold">
                            {o.customerName ?? '—'}
                          </p>
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="size-3.5" />
                            {o.customerEmail ?? '—'}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Account ID: {o.userId.slice(0, 12)}…
                          </p>
                        </section>

                        <section>
                          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                            <MapPin className="size-4 text-primary" />
                            Shipping address
                          </h3>
                          {o.shippingLine1 ? (
                            <address className="text-sm not-italic text-muted-foreground">
                              {o.shippingName && (
                                <span className="block font-semibold text-foreground">
                                  {o.shippingName}
                                </span>
                              )}
                              {o.shippingLine1}
                              {o.shippingLine2 ? `, ${o.shippingLine2}` : ''}
                              <br />
                              {[o.shippingCity, o.shippingState, o.shippingPostalCode]
                                .filter(Boolean)
                                .join(', ')}
                              <br />
                              {o.shippingCountry}
                            </address>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No shipping address on file.
                            </p>
                          )}
                        </section>

                        <section>
                          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                            <CreditCard className="size-4 text-primary" />
                            Payment
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {o.stripePaymentIntentId
                              ? `Stripe · ${o.stripePaymentIntentId.slice(0, 18)}…`
                              : 'Pending'}
                          </p>
                        </section>
                      </div>

                      {/* Created products */}
                      <div>
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                          <Package className="size-4 text-primary" />
                          Products to make
                        </h3>
                        <ul className="flex flex-col gap-3">
                          {o.items.map((it) => (
                            <li
                              key={it.id}
                              className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 p-3"
                            >
                              <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-card">
                                <GarmentThumb layer={it.layer} size={56} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold">
                                  {it.designTitle}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {GARMENT_LABEL[it.garment]} ·{' '}
                                  {variantName(it.garment, it.variant)} · ×
                                  {it.qty}
                                </p>
                              </div>
                              <span className="text-sm font-bold">
                                {formatUSD((it.unitPrice * it.qty) / 100)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Status controls */}
                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Update status:
                      </span>
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => changeStatus(o.id, s)}
                          disabled={pending || o.status === s}
                          className={
                            'rounded-full px-3 py-1 text-xs font-bold capitalize transition-colors disabled:opacity-50 ' +
                            (o.status === s
                              ? STATUS_STYLES[s]
                              : 'bg-secondary text-muted-foreground hover:text-foreground')
                          }
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
