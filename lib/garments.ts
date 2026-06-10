import type { GarmentType } from './types'

export const GARMENT_LABEL: Record<GarmentType, string> = {
  head: 'Mascot Head',
  shirt: 'Shirt',
  sweatpants: 'Sweatpants',
}

/** Grid resolution for each garment's paint canvas. */
export const GRID: Record<GarmentType, { cols: number; rows: number }> = {
  head: { cols: 20, rows: 20 },
  shirt: { cols: 22, rows: 20 },
  sweatpants: { cols: 18, rows: 24 },
}

/** Default fabric color when a garment is first created. */
export const DEFAULT_BASE: Record<GarmentType, string> = {
  head: '#f2d9b1',
  shirt: '#cfe3f0',
  sweatpants: '#3b4a5a',
}

/** Cozy, non-purple paint palette. */
export const PALETTE = [
  '#e8705a', // coral
  '#f2a65a', // peach
  '#f2c14e', // sunflower
  '#7bc47f', // leaf
  '#4f9d8f', // teal
  '#5a9bd4', // sky
  '#3b4a5a', // slate
  '#9b6a4a', // cocoa
  '#f6efe6', // cream
  '#2b2b2b', // ink
  '#e58fae', // blossom
  '#c0d860', // lime
]

export type GarmentStyle = {
  id: string
  name: string
  variant: string
}

const STYLES: Record<GarmentType, GarmentStyle[]> = {
  head: [
    { id: 'round', name: 'Round', variant: 'round' },
    { id: 'bear', name: 'Bear', variant: 'bear' },
    { id: 'bunny', name: 'Bunny', variant: 'bunny' },
  ],
  shirt: [
    { id: 'crewneck', name: 'Crewneck', variant: 'crewneck' },
    { id: 'hoodie', name: 'Hoodie', variant: 'hoodie' },
    { id: 'tank', name: 'Tank', variant: 'tank' },
  ],
  sweatpants: [
    { id: 'jogger', name: 'Jogger', variant: 'jogger' },
    { id: 'flare', name: 'Flare', variant: 'flare' },
    { id: 'short', name: 'Shorts', variant: 'short' },
  ],
}

export function stylesFor(garment: GarmentType): GarmentStyle[] {
  return STYLES[garment]
}

export function defaultVariant(garment: GarmentType): string {
  return STYLES[garment][0].variant
}
