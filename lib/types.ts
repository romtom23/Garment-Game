export type GarmentType = 'head' | 'shirt' | 'sweatpants'

/** A point in normalized garment space (0..1 within the canvas box). */
export type Vec2 = { x: number; y: number }

/** Vector shape kinds that can be placed and painted on a garment. */
export type ShapeKind =
  | 'circle'
  | 'rect'
  | 'line'
  | 'triangle'
  | 'star'
  | 'path'
  | 'image'

/**
 * A vector decoration placed on a garment. All geometry is normalized to the
 * 0..1 canvas box so designs scale cleanly across previews, thumbnails and the
 * 3D inflate. This replaces the old pixel-grid `PaintCell` model with smooth,
 * resizable, repaintable shapes (NikeID-meets-Sims style customization).
 */
export type Decoration = {
  id: string
  kind: ShapeKind
  /** center x (circle/rect/triangle/star) — normalized 0..1 */
  x: number
  /** center y — normalized 0..1 */
  y: number
  /** bounding-box width — normalized 0..1 */
  w: number
  /** bounding-box height — normalized 0..1 */
  h: number
  /** rotation in degrees, around the center */
  rotation: number
  /** fill color (the "paint") */
  fill: string
  /** outline color */
  stroke: string
  /** stroke width as a fraction of the canvas width (0..1) */
  strokeWidth: number
  /** for `line` and freehand `path` kinds — normalized points */
  points?: Vec2[]
  /** for the `image` kind — the uploaded image URL (Vercel Blob) */
  src?: string
}

export type DesignLayer = {
  garment: GarmentType
  /** style variant id, e.g. "crewneck" | "hoodie" */
  variant: string
  /** base fabric color applied to the whole garment */
  baseColor: string
  /** vector decorations layered on top of the base color (paint order) */
  decorations: Decoration[]
}

export type Design = {
  id: string
  ownerId: string
  title: string
  layers: DesignLayer[]
  published: boolean
  slug: string | null
  createdAt: number
  updatedAt: number
}

export type User = {
  id: string
  name: string
  email: string
}

/** A single line item in a user's persisted cart. */
export type CartItem = {
  id: number
  designId: string
  designTitle: string
  garment: GarmentType
  variant: string
  /** unit price in cents */
  unitPrice: number
  qty: number
  /** snapshot of the layer so the cart can render a thumbnail */
  layer: DesignLayer
  createdAt: number
}

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'canceled'

export type OrderItem = {
  id: number
  orderId: string
  designId: string | null
  designTitle: string
  garment: GarmentType
  variant: string
  unitPrice: number
  qty: number
  layer: DesignLayer
}

export type Order = {
  id: string
  userId: string
  status: OrderStatus
  customerName: string | null
  customerEmail: string | null
  /** total in cents */
  amountTotal: number
  currency: string
  shippingName: string | null
  shippingLine1: string | null
  shippingLine2: string | null
  shippingCity: string | null
  shippingState: string | null
  shippingPostalCode: string | null
  shippingCountry: string | null
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  createdAt: number
  items: OrderItem[]
}

export type WizardRole = 'user' | 'wizard'

export type WizardMessage = {
  id: string
  role: WizardRole
  text: string
  /** optional quick chips suggested by the wizard */
  suggestions?: string[]
}
