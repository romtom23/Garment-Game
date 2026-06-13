import type { Design, DesignLayer, GarmentType } from './types'

/** Base factory cost per garment (what a partner warehouse charges us). */
const FACTORY_BASE: Record<GarmentType, number> = {
  head: 28,
  shirt: 14,
  sweatpants: 19,
}

/** Our markup over factory cost. Lower because partners already run the line. */
const MARGIN = 0.45

/** Each placed decoration adds a small print cost; capped so designs stay affordable. */
const PER_DECORATION = 0.6
const DECORATION_CAP = 9

export type GarmentPrice = {
  garment: GarmentType
  factory: number
  design: number
  total: number
}

export type DesignPrice = {
  perGarment: GarmentPrice[]
  factoryTotal: number
  designTotal: number
  total: number
  /** rough retail price if this were sold by a traditional brand */
  retailComparison: number
}

function priceLayer(layer: DesignLayer): GarmentPrice {
  const factory = FACTORY_BASE[layer.garment]
  const designCost = Math.min(
    DECORATION_CAP,
    layer.decorations.length * PER_DECORATION,
  )
  const total = factory * (1 + MARGIN) + designCost
  return {
    garment: layer.garment,
    factory,
    design: designCost,
    total: Math.round(total * 100) / 100,
  }
}

export function priceDesign(design: Design): DesignPrice {
  const perGarment = design.layers.map(priceLayer)
  const factoryTotal = perGarment.reduce((s, g) => s + g.factory, 0)
  const designTotal = perGarment.reduce((s, g) => s + g.design, 0)
  const total = perGarment.reduce((s, g) => s + g.total, 0)
  return {
    perGarment,
    factoryTotal: round(factoryTotal),
    designTotal: round(designTotal),
    total: round(total),
    retailComparison: round(total * 1.9),
  }
}

/** Price for a single garment layer (used by the cart / add-to-cart flow). */
export function priceSingleLayer(layer: DesignLayer): number {
  return priceLayer(layer).total
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

export function formatUSD(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}

/** Dollars -> integer cents for Stripe / DB storage. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100)
}
