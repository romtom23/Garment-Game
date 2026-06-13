'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { orders, orderItems } from '@/lib/db/schema'
import { desc, eq, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import type {
  DesignLayer,
  GarmentType,
  Order,
  OrderItem,
  OrderStatus,
} from '@/lib/types'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

type OrderRow = typeof orders.$inferSelect
type ItemRow = typeof orderItems.$inferSelect

function toOrderItem(row: ItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.orderId,
    designId: row.designId,
    designTitle: row.designTitle,
    garment: row.garment as GarmentType,
    variant: row.variant,
    unitPrice: row.unitPrice,
    qty: row.qty,
    layer: row.layer as DesignLayer,
  }
}

function toOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status as OrderStatus,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    amountTotal: row.amountTotal,
    currency: row.currency,
    shippingName: row.shippingName,
    shippingLine1: row.shippingLine1,
    shippingLine2: row.shippingLine2,
    shippingCity: row.shippingCity,
    shippingState: row.shippingState,
    shippingPostalCode: row.shippingPostalCode,
    shippingCountry: row.shippingCountry,
    stripeSessionId: row.stripeSessionId,
    stripePaymentIntentId: row.stripePaymentIntentId,
    createdAt: row.createdAt.getTime(),
    items,
  }
}

async function hydrate(rows: OrderRow[]): Promise<Order[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, ids))
  const byOrder = new Map<string, OrderItem[]>()
  for (const it of items) {
    const list = byOrder.get(it.orderId) ?? []
    list.push(toOrderItem(it))
    byOrder.set(it.orderId, list)
  }
  return rows.map((r) => toOrder(r, byOrder.get(r.id) ?? []))
}

/** Orders for the signed-in user (their own purchase history). */
export async function getMyOrders(): Promise<Order[]> {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
  return hydrate(rows)
}

/**
 * All paid/fulfilled orders across the store, for the admin order tracker.
 * Pending (never-completed) checkouts are hidden to keep the board clean.
 */
export async function getAllOrders(): Promise<Order[]> {
  await getUserId() // must be signed in to view the admin board
  const rows = await db
    .select()
    .from(orders)
    .where(inArray(orders.status, ['paid', 'fulfilled', 'canceled']))
    .orderBy(desc(orders.createdAt))
  return hydrate(rows)
}

export async function setOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<void> {
  await getUserId()
  await db.update(orders).set({ status }).where(eq(orders.id, id))
}
