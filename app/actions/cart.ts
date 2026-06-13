'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cartItems } from '@/lib/db/schema'
import { and, asc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { CartItem, DesignLayer, GarmentType } from '@/lib/types'
import { priceSingleLayer, toCents } from '@/lib/pricing'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

type Row = typeof cartItems.$inferSelect

function toCartItem(row: Row): CartItem {
  return {
    id: row.id,
    designId: row.designId,
    designTitle: row.designTitle,
    garment: row.garment as GarmentType,
    variant: row.variant,
    unitPrice: row.unitPrice,
    qty: row.qty,
    layer: row.layer as DesignLayer,
    createdAt: row.createdAt.getTime(),
  }
}

export async function getCart(): Promise<CartItem[]> {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.userId, userId))
    .orderBy(asc(cartItems.createdAt))
  return rows.map(toCartItem)
}

export async function addToCart(input: {
  designId: string
  designTitle: string
  layer: DesignLayer
  qty?: number
}): Promise<void> {
  const userId = await getUserId()
  const unitPrice = toCents(priceSingleLayer(input.layer))
  await db.insert(cartItems).values({
    userId,
    designId: input.designId,
    designTitle: input.designTitle,
    garment: input.layer.garment,
    variant: input.layer.variant,
    unitPrice,
    qty: input.qty ?? 1,
    layer: input.layer,
  })
  revalidatePath('/cart')
}

export async function updateCartQty(id: number, qty: number): Promise<void> {
  const userId = await getUserId()
  if (qty <= 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
  } else {
    await db
      .update(cartItems)
      .set({ qty })
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
  }
  revalidatePath('/cart')
}

export async function removeFromCart(id: number): Promise<void> {
  const userId = await getUserId()
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
  revalidatePath('/cart')
}

export async function clearCart(): Promise<void> {
  const userId = await getUserId()
  await db.delete(cartItems).where(eq(cartItems.userId, userId))
  revalidatePath('/cart')
}

export async function getCartCount(): Promise<number> {
  const userId = await getUserId()
  const rows = await db
    .select({ qty: cartItems.qty })
    .from(cartItems)
    .where(eq(cartItems.userId, userId))
  return rows.reduce((sum, r) => sum + r.qty, 0)
}
