import type { GarmentType } from './types'
import { GRID } from './garments'
import { silhouettePaths } from './silhouettes'

/**
 * Rasterizes the smooth vector silhouette paths into a boolean grid mask
 * (length cols*rows). The 2D editor and the 3D inflate share this single
 * source of truth, so the puffed mesh follows the same smooth outline the
 * user sees in the design canvas.
 */
export function buildMask(garment: GarmentType, variant: string): boolean[] {
  const { cols, rows } = GRID[garment]
  const mask = new Array(cols * rows).fill(false)
  const paths = silhouettePaths(garment, variant).map((d) => parsePath(d))

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) / cols
      const py = (r + 0.5) / rows
      let inside = false
      for (const poly of paths) {
        if (pointInPolygon(px, py, poly)) inside = !inside ? true : inside
      }
      mask[r * cols + c] = inside
    }
  }
  return mask
}

type Pt = { x: number; y: number }

/**
 * Flattens an SVG path `d` string (supporting M/L/Q/A/Z, absolute + relative)
 * into a dense polygon of points for fast point-in-polygon testing.
 */
function parsePath(d: string): Pt[] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? []
  const pts: Pt[] = []
  let i = 0
  let cx = 0
  let cy = 0
  let startX = 0
  let startY = 0
  let cmd = ''
  const num = () => parseFloat(tokens[i++])

  const quad = (x1: number, y1: number, x2: number, y2: number) => {
    const steps = 16
    for (let s = 1; s <= steps; s++) {
      const t = s / steps
      const mt = 1 - t
      const x = mt * mt * cx + 2 * mt * t * x1 + t * t * x2
      const y = mt * mt * cy + 2 * mt * t * y1 + t * t * y2
      pts.push({ x, y })
    }
    cx = x2
    cy = y2
  }

  // Arc flattened as an elliptical sweep (good enough for our circle ellipses).
  const arc = (rx: number, ry: number, large: number, sweep: number, x2: number, y2: number) => {
    void large
    const steps = 24
    // Approximate center as midpoint offset — for our usage arcs are half
    // circles forming full ellipses, so sample along an ellipse between points.
    const mx = (cx + x2) / 2
    const my = (cy + y2) / 2
    const startAng = Math.atan2(cy - my, cx - mx)
    const dir = sweep ? 1 : -1
    for (let s = 1; s <= steps; s++) {
      const t = s / steps
      const ang = startAng + dir * Math.PI * t
      pts.push({ x: mx + Math.cos(ang) * rx, y: my + Math.sin(ang) * ry })
    }
    cx = x2
    cy = y2
  }

  while (i < tokens.length) {
    const tk = tokens[i]
    if (/[a-zA-Z]/.test(tk)) {
      cmd = tk
      i++
    }
    switch (cmd) {
      case 'M':
        cx = num(); cy = num(); startX = cx; startY = cy; pts.push({ x: cx, y: cy }); cmd = 'L'; break
      case 'm':
        cx += num(); cy += num(); startX = cx; startY = cy; pts.push({ x: cx, y: cy }); cmd = 'l'; break
      case 'L':
        cx = num(); cy = num(); pts.push({ x: cx, y: cy }); break
      case 'l':
        cx += num(); cy += num(); pts.push({ x: cx, y: cy }); break
      case 'H':
        cx = num(); pts.push({ x: cx, y: cy }); break
      case 'V':
        cy = num(); pts.push({ x: cx, y: cy }); break
      case 'Q': {
        const x1 = num(); const y1 = num(); const x2 = num(); const y2 = num(); quad(x1, y1, x2, y2); break
      }
      case 'q': {
        const x1 = cx + num(); const y1 = cy + num(); const x2 = cx + num(); const y2 = cy + num(); quad(x1, y1, x2, y2); break
      }
      case 'A': {
        const rx = num(); const ry = num(); num(); const large = num(); const sweep = num(); const x2 = num(); const y2 = num(); arc(rx, ry, large, sweep, x2, y2); break
      }
      case 'a': {
        const rx = num(); const ry = num(); num(); const large = num(); const sweep = num(); const x2 = cx + num(); const y2 = cy + num(); arc(rx, ry, large, sweep, x2, y2); break
      }
      case 'Z':
      case 'z':
        cx = startX; cy = startY; break
      default:
        i++
    }
  }
  return pts
}

function pointInPolygon(x: number, y: number, poly: Pt[]): boolean {
  let inside = false
  for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
    const xi = poly[a].x
    const yi = poly[a].y
    const xj = poly[b].x
    const yj = poly[b].y
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
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
  const INF = 9999
  for (let i = 0; i < field.length; i++) field[i] = mask[i] ? INF : 0

  const idx = (c: number, r: number) => r * cols + c
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!mask[idx(c, r)]) continue
      let m = field[idx(c, r)]
      if (c > 0) m = Math.min(m, field[idx(c - 1, r)] + 1)
      if (r > 0) m = Math.min(m, field[idx(c, r - 1)] + 1)
      field[idx(c, r)] = m
    }
  }
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
