'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { designs } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { Design, DesignLayer } from '@/lib/types'
import { emptyLayers, slugify, uid } from '@/lib/design-helpers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

type Row = typeof designs.$inferSelect

function toDesign(row: Row): Design {
  return {
    id: row.id,
    ownerId: row.userId,
    title: row.title,
    layers: row.layers as DesignLayer[],
    published: row.published,
    slug: row.slug,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  }
}

export async function listDesigns(): Promise<Design[]> {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(designs)
    .where(eq(designs.userId, userId))
    .orderBy(desc(designs.updatedAt))
  return rows.map(toDesign)
}

export async function getDesign(id: string): Promise<Design | null> {
  const userId = await getUserId()
  const [row] = await db
    .select()
    .from(designs)
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))
    .limit(1)
  return row ? toDesign(row) : null
}

export async function createDesign(title = 'Untitled drop'): Promise<Design> {
  const userId = await getUserId()
  const id = uid()
  const now = new Date()
  const [row] = await db
    .insert(designs)
    .values({
      id,
      userId,
      title,
      layers: emptyLayers(),
      published: false,
      slug: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  revalidatePath('/dashboard')
  return toDesign(row)
}

export async function saveDesign(input: {
  id: string
  title: string
  layers: DesignLayer[]
}): Promise<Design> {
  const userId = await getUserId()
  const [row] = await db
    .update(designs)
    .set({ title: input.title, layers: input.layers, updatedAt: new Date() })
    .where(and(eq(designs.id, input.id), eq(designs.userId, userId)))
    .returning()
  if (!row) throw new Error('Design not found')
  revalidatePath('/dashboard')
  revalidatePath(`/studio/${input.id}`)
  return toDesign(row)
}

export async function deleteDesign(id: string): Promise<void> {
  const userId = await getUserId()
  await db
    .delete(designs)
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))
  revalidatePath('/dashboard')
}

export async function publishDesign(id: string): Promise<Design> {
  const userId = await getUserId()
  const existing = await getDesign(id)
  if (!existing) throw new Error('Design not found')
  const slug =
    existing.slug ?? `${slugify(existing.title)}-${existing.id.slice(0, 4)}`
  const [row] = await db
    .update(designs)
    .set({ published: true, slug, updatedAt: new Date() })
    .where(and(eq(designs.id, id), eq(designs.userId, userId)))
    .returning()
  revalidatePath('/dashboard')
  revalidatePath(`/shop/${slug}`)
  return toDesign(row)
}

/** Public lookup for a published design (no auth) — used by the shop page. */
export async function getPublishedDesignBySlug(
  slug: string,
): Promise<Design | null> {
  const [row] = await db
    .select()
    .from(designs)
    .where(and(eq(designs.slug, slug), eq(designs.published, true)))
    .limit(1)
  return row ? toDesign(row) : null
}
