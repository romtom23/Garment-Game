import type { GarmentType } from './types'
import { GRID } from './garments'

/**
 * Returns a boolean mask (length cols*rows) describing which grid cells are
 * "inside" the garment silhouette for the given variant. The silhouette is
 * built procedurally so the 2D canvas and the 3D inflate share one source.
 */
export function buildMask(garment: GarmentType, variant: string): boolean[] {
  const { cols, rows } = GRID[garment]
  const mask = new Array(cols * rows).fill(false)
  const set = (c: number, r: number, v = true) => {
    if (c < 0 || c >= cols || r < 0 || r >= rows) return
    mask[r * cols + c] = v
  }
  const nx = (c: number) => c / (cols - 1) // 0..1
  const ny = (r: number) => r / (rows - 1) // 0..1

  if (garment === 'head') {
    const cx = 0.5
    const cy = 0.52
    const rx = 0.42
    const ry = 0.46
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = (nx(c) - cx) / rx
        const dy = (ny(r) - cy) / ry
        if (dx * dx + dy * dy <= 1) set(c, r)
        // ears for bear/bunny
        if (variant === 'bear') {
          const ex = 0.22
          for (const sx of [cx - 0.26, cx + 0.26]) {
            const edx = (nx(c) - sx) / 0.16
            const edy = (ny(r) - 0.16) / 0.16
            if (edx * edx + edy * edy <= 1) set(c, r)
          }
          void ex
        } else if (variant === 'bunny') {
          for (const sx of [cx - 0.16, cx + 0.16]) {
            const edx = (nx(c) - sx) / 0.08
            const edy = (ny(r) - 0.12) / 0.22
            if (edx * edx + edy * edy <= 1) set(c, r)
          }
        }
      }
    }
    return mask
  }

  if (garment === 'shirt') {
    const tank = variant === 'tank'
    const hoodie = variant === 'hoodie'
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = nx(c)
        const y = ny(r)
        const inBody = x >= 0.28 && x <= 0.72 && y >= 0.18 && y <= 0.96
        // sleeves taper out near the top
        const sleeveTop = y >= 0.18 && y <= 0.46
        const inSleeve =
          !tank &&
          sleeveTop &&
          ((x >= 0.08 && x < 0.28) || (x > 0.72 && x <= 0.92))
        const tankStrap = tank && x >= 0.3 && x <= 0.7 && y >= 0.12 && y < 0.18
        if (inBody || inSleeve || tankStrap) set(c, r)
        // neckline notch
        if (y < 0.22 && x > 0.42 && x < 0.58) set(c, r, false)
        // hoodie hood bump
        if (hoodie && y >= 0.06 && y < 0.18 && x >= 0.38 && x <= 0.62) set(c, r)
      }
    }
    return mask
  }

  // sweatpants
  const short = variant === 'short'
  const flare = variant === 'flare'
  const legBottom = short ? 0.55 : 0.98
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = nx(c)
      const y = ny(r)
      const waist = y >= 0.04 && y < 0.2 && x >= 0.24 && x <= 0.76
      let legs = false
      if (y >= 0.2 && y <= legBottom) {
        const spread = flare ? 0.06 + (y - 0.2) * 0.14 : 0.02
        const left = x >= 0.24 - spread && x <= 0.46 + spread
        const right = x >= 0.54 - spread && x <= 0.76 + spread
        legs = left || right
      }
      if (waist || legs) set(c, r)
    }
  }
  return mask
}

/**
 * Distance-from-edge field (in cell units) for every inside cell. Used to puff
 * the 3D mesh more in the middle than at the edges. Outside cells are 0.
 */
export function edgeDistanceField(
  garment: GarmentType,
  mask: boolean[],
): Float32Array {
  const { cols, rows } = GRID[garment]
  const field = new Float32Array(cols * rows)
  // multi-pass chamfer-ish distance transform
  const INF = 9999
  for (let i = 0; i < field.length; i++) field[i] = mask[i] ? INF : 0

  const idx = (c: number, r: number) => r * cols + c
  // forward pass
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!mask[idx(c, r)]) continue
      let m = field[idx(c, r)]
      if (c > 0) m = Math.min(m, field[idx(c - 1, r)] + 1)
      if (r > 0) m = Math.min(m, field[idx(c, r - 1)] + 1)
      field[idx(c, r)] = m
    }
  }
  // backward pass
  for (let r = rows - 1; r >= 0; r--) {
    for (let c = cols - 1; c >= 0; c--) {
      if (!mask[idx(c, r)]) continue
      let m = field[idx(c, r)]
      if (c < cols - 1) m = Math.min(m, field[idx(c + 1, r)] + 1)
      if (r < rows - 1) m = Math.min(m, field[idx(c, r + 1)] + 1)
      field[idx(c, r)] = m
    }
  }
  return field
}
