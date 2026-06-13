import type { GarmentType } from './types'

/**
 * Smooth, vector silhouette paths for each garment + variant. All coordinates
 * are normalized to a 0..1 viewBox so the same paths drive the 2D editor clip,
 * the design preview, and the catalog thumbnails. This replaces the old blocky
 * grid-cell silhouette for a refined, NikeID-style finish.
 *
 * Each silhouette is one or more SVG path `d` strings. When there is more than
 * one, earlier paths render behind later ones (e.g. ears behind a head).
 */

function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`
}

const SHIRT_CREWNECK = `
  M0.30,0.22 Q0.30,0.20 0.34,0.20 L0.42,0.20
  Q0.50,0.30 0.58,0.20 L0.66,0.20 Q0.70,0.20 0.72,0.22
  L0.90,0.30 Q0.92,0.31 0.92,0.34 L0.92,0.42 Q0.92,0.45 0.89,0.45
  L0.74,0.45 L0.72,0.44 L0.72,0.93 Q0.72,0.96 0.69,0.96
  L0.31,0.96 Q0.28,0.96 0.28,0.93 L0.28,0.44 L0.26,0.45
  L0.11,0.45 Q0.08,0.45 0.08,0.42 L0.08,0.34 Q0.08,0.31 0.10,0.30
  L0.28,0.22 Z
`

const SHIRT_TANK_BODY = `
  M0.30,0.30 L0.40,0.30 Q0.50,0.40 0.60,0.30 L0.70,0.30
  L0.70,0.93 Q0.70,0.96 0.67,0.96 L0.33,0.96 Q0.30,0.96 0.30,0.93 Z
`
const SHIRT_TANK_STRAP_L = `M0.34,0.31 L0.41,0.31 L0.44,0.15 L0.38,0.15 Z`
const SHIRT_TANK_STRAP_R = `M0.59,0.31 L0.66,0.31 L0.62,0.15 L0.56,0.15 Z`

function pants(variant: string): string[] {
  const short = variant === 'short'
  const flare = variant === 'flare'
  const bottom = short ? 0.58 : 0.95
  const outerR = flare ? 0.82 : 0.74
  const outerL = flare ? 0.18 : 0.26
  const lip = Math.min(bottom + 0.02, 0.99)
  const crotch = 0.4
  return [
    `M0.24,0.11 Q0.24,0.07 0.28,0.07 L0.72,0.07 Q0.76,0.07 0.76,0.11 ` +
      `L${outerR.toFixed(2)},${bottom.toFixed(2)} Q${outerR.toFixed(2)},${lip.toFixed(2)} ${(outerR - 0.03).toFixed(2)},${lip.toFixed(2)} ` +
      `L0.57,${lip.toFixed(2)} Q0.54,${lip.toFixed(2)} 0.54,${bottom.toFixed(2)} L0.50,${crotch.toFixed(2)} ` +
      `L0.46,${bottom.toFixed(2)} Q0.46,${lip.toFixed(2)} 0.43,${lip.toFixed(2)} ` +
      `L${(outerL + 0.03).toFixed(2)},${lip.toFixed(2)} Q${outerL.toFixed(2)},${lip.toFixed(2)} ${outerL.toFixed(2)},${bottom.toFixed(2)} Z`,
  ]
}

export function silhouettePaths(
  garment: GarmentType,
  variant: string,
): string[] {
  if (garment === 'head') {
    if (variant === 'bear') {
      return [
        ellipse(0.27, 0.22, 0.13, 0.13),
        ellipse(0.73, 0.22, 0.13, 0.13),
        ellipse(0.5, 0.54, 0.41, 0.43),
      ]
    }
    if (variant === 'bunny') {
      return [
        ellipse(0.37, 0.22, 0.07, 0.2),
        ellipse(0.63, 0.22, 0.07, 0.2),
        ellipse(0.5, 0.56, 0.4, 0.4),
      ]
    }
    return [ellipse(0.5, 0.52, 0.42, 0.46)]
  }

  if (garment === 'shirt') {
    if (variant === 'tank') {
      return [SHIRT_TANK_STRAP_L, SHIRT_TANK_STRAP_R, SHIRT_TANK_BODY]
    }
    if (variant === 'hoodie') {
      return [ellipse(0.5, 0.18, 0.22, 0.13), SHIRT_CREWNECK]
    }
    return [SHIRT_CREWNECK]
  }

  return pants(variant)
}
