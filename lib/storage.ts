import type { Design, DesignLayer, GarmentType } from './types'
import { DEFAULT_BASE, defaultVariant } from './garments'

const KEY = 'loomly:designs'

const GARMENTS: GarmentType[] = ['head', 'shirt', 'sweatpants']

function emptyLayers(): DesignLayer[] {
  return GARMENTS.map((garment) => ({
    garment,
    variant: defaultVariant(garment),
    baseColor: DEFAULT_BASE[garment],
    cells: [],
  }))
}

function readAll(): Design[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Design[]) : []
  } catch {
    return []
  }
}

function writeAll(designs: Design[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(designs))
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'shop'
  )
}

export function listDesigns(ownerId: string): Design[] {
  return readAll()
    .filter((d) => d.ownerId === ownerId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getDesign(id: string): Design | null {
  return readAll().find((d) => d.id === id) ?? null
}

export function getDesignBySlug(slug: string): Design | null {
  return readAll().find((d) => d.slug === slug && d.published) ?? null
}

export function createDesign(ownerId: string, title = 'Untitled drop'): Design {
  const now = Date.now()
  const design: Design = {
    id: uid(),
    ownerId,
    title,
    layers: emptyLayers(),
    published: false,
    slug: null,
    createdAt: now,
    updatedAt: now,
  }
  const all = readAll()
  all.push(design)
  writeAll(all)
  return design
}

export function saveDesign(design: Design): Design {
  const all = readAll()
  const idx = all.findIndex((d) => d.id === design.id)
  const updated = { ...design, updatedAt: Date.now() }
  if (idx >= 0) all[idx] = updated
  else all.push(updated)
  writeAll(all)
  return updated
}

export function deleteDesign(id: string) {
  writeAll(readAll().filter((d) => d.id !== id))
}

export function publishDesign(id: string): Design | null {
  const all = readAll()
  const idx = all.findIndex((d) => d.id === id)
  if (idx < 0) return null
  const design = all[idx]
  const slug =
    design.slug ?? `${slugify(design.title)}-${design.id.slice(0, 4)}`
  const updated: Design = {
    ...design,
    published: true,
    slug,
    updatedAt: Date.now(),
  }
  all[idx] = updated
  writeAll(all)
  return updated
}
