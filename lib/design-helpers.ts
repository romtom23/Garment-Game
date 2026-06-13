import type { DesignLayer, GarmentType } from './types'
import { DEFAULT_BASE, defaultVariant } from './garments'

const GARMENTS: GarmentType[] = ['head', 'shirt', 'sweatpants']

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Fresh, empty layers for a new design (vector model — no decorations yet). */
export function emptyLayers(): DesignLayer[] {
  return GARMENTS.map((garment) => ({
    garment,
    variant: defaultVariant(garment),
    baseColor: DEFAULT_BASE[garment],
    decorations: [],
  }))
}

export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'shop'
  )
}
