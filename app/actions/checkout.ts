'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cartItems, orders, orderItems } from '@/lib/db/schema'
import { stripe } from '@/lib/stripe'
import { and, asc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import type { DesignLayer, GarmentType } from '@/lib/types'
import { GARMENT_LABEL } from '@/lib/garments'
import { uid } from '@/lib/design-helpers'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session
}

/**
 * Creates a Stripe embedded Checkout session for the current user's cart and a
 * matching `pending` order row. The order is finalized (paid + shipping/billing
 * captured) when the client confirms the session via `finalizeOrder`.
 */
export async function createCheckoutSession(): Promise<{ clientSecret: string }> {
  const session = await getSession()
  const userId = session.user.id

  const items = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.userId, userId))
    .orderBy(asc(cartItems.createdAt))

  if (items.length === 0) throw new Error('Your cart is empty')

  const orderId = uid()

  const checkout = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    mode: 'payment',
    redirect_on_completion: 'never',
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB', 'AU'],
    },
    line_items: items.map((it) => ({
      quantity: it.qty,
      price_data: {
        currency: 'usd',
        unit_amount: it.unitPrice,
        product_data: {
          name: `${it.designTitle} — ${GARMENT_LABEL[it.garment as GarmentType]}`,
          description: `Style: ${it.variant}`,
        },
      },
    })),
    metadata: { orderId, userId },
  })

  const amountTotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0)

  await db.insert(orders).values({
    id: orderId,
    userId,
    status: 'pending',
    customerName: session.user.name,
    customerEmail: session.user.email,
    amountTotal,
    currency: 'usd',
    stripeSessionId: checkout.id,
  })

  await db.insert(orderItems).values(
    items.map((it) => ({
      orderId,
      designId: it.designId,
      designTitle: it.designTitle,
      garment: it.garment,
      variant: it.variant,
      unitPrice: it.unitPrice,
      qty: it.qty,
      layer: it.layer as DesignLayer,
    })),
  )

  if (!checkout.client_secret) throw new Error('Failed to start checkout')
  return { clientSecret: checkout.client_secret }
}

/**
 * Called by the return page after embedded checkout completes. Verifies payment
 * with Stripe, writes shipping/billing details onto the order, marks it paid,
 * and clears the cart. Safe to call more than once (idempotent).
 */
export async function finalizeOrder(): Promise<{
  status: 'paid' | 'pending'
  orderId: string | null
}> {
  const session = await getSession()
  const userId = session.user.id

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, 'pending')))
    .orderBy(asc(orders.createdAt))
    .limit(1)

  if (!order || !order.stripeSessionId) {
    return { status: 'pending', orderId: null }
  }

  const cs = await stripe.checkout.sessions.retrieve(order.stripeSessionId, {
    expand: ['payment_intent'],
  })

  if (cs.payment_status !== 'paid') {
    return { status: 'pending', orderId: order.id }
  }

  const shipping = cs.collected_information?.shipping_details ?? null
  const billing = cs.customer_details?.address ?? null
  const paymentIntentId =
    typeof cs.payment_intent === 'string'
      ? cs.payment_intent
      : (cs.payment_intent?.id ?? null)

  await db
    .update(orders)
    .set({
      status: 'paid',
      stripePaymentIntentId: paymentIntentId,
      customerName: cs.customer_details?.name ?? order.customerName,
      customerEmail: cs.customer_details?.email ?? order.customerEmail,
      amountTotal: cs.amount_total ?? order.amountTotal,
      shippingName: shipping?.name ?? cs.customer_details?.name ?? null,
      shippingLine1: shipping?.address?.line1 ?? billing?.line1 ?? null,
      shippingLine2: shipping?.address?.line2 ?? billing?.line2 ?? null,
      shippingCity: shipping?.address?.city ?? billing?.city ?? null,
      shippingState: shipping?.address?.state ?? billing?.state ?? null,
      shippingPostalCode:
        shipping?.address?.postal_code ?? billing?.postal_code ?? null,
      shippingCountry: shipping?.address?.country ?? billing?.country ?? null,
    })
    .where(eq(orders.id, order.id))

  await db.delete(cartItems).where(eq(cartItems.userId, userId))

  return { status: 'paid', orderId: order.id }
}
