export type GarmentType = 'head' | 'shirt' | 'sweatpants'

export type PaintCell = {
  /** flat index into the garment grid (row * cols + col) */
  i: number
  color: string
}

export type DesignLayer = {
  garment: GarmentType
  /** style variant id, e.g. "crewneck" | "hoodie" */
  variant: string
  /** base fabric color applied to the whole garment */
  baseColor: string
  /** painted cells layered on top of the base color */
  cells: PaintCell[]
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

export type WizardRole = 'user' | 'wizard'

export type WizardMessage = {
  id: string
  role: WizardRole
  text: string
  /** optional quick chips suggested by the wizard */
  suggestions?: string[]
}
