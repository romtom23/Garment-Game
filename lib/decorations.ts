import type { Decoration, DesignLayer, ShapeKind, Vec2 } from './types'

/** Default normalized size for a freshly placed shape. */
export const DEFAULT_SIZE = 0.22

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Create a new decoration centered at (x, y) in normalized space. */
export function makeDecoration(
  kind: ShapeKind,
  x: number,
  y: number,
  fill: string,
  stroke = '#2b2b2b',
): Decoration {
  const base: Decoration = {
    id: uid(),
    kind,
    x,
    y,
    w: DEFAULT_SIZE,
    h: DEFAULT_SIZE,
    rotation: 0,
    fill,
    stroke,
    strokeWidth: kind === 'line' ? 0.018 : 0.006,
  }
  if (kind === 'line') {
    base.points = [
      { x: x - DEFAULT_SIZE / 2, y },
      { x: x + DEFAULT_SIZE / 2, y },
    ]
  }
  return base
}

/** Rotate a point around a center by `deg` degrees. */
function rotate(px: number, py: number, cx: number, cy: number, deg: number) {
  if (!deg) return { x: px, y: py }
  const r = (-deg * Math.PI) / 180
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  const dx = px - cx
  const dy = py - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}

/** Distance from point p to segment a-b. */
function distToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/**
 * True if the normalized point (px, py) is painted by this decoration.
 * Used both for editor hit-testing and for sampling color onto the 3D mesh.
 */
export function decorationContains(d: Decoration, px: number, py: number): boolean {
  if (d.kind === 'line' || d.kind === 'path') {
    const pts = d.points ?? []
    const half = Math.max(d.strokeWidth, 0.01) / 2 + 0.004
    for (let i = 0; i < pts.length - 1; i++) {
      if (distToSegment({ x: px, y: py }, pts[i], pts[i + 1]) <= half) return true
    }
    return false
  }

  // Rotate the query point into the shape's local (unrotated) frame.
  const local = rotate(px, py, d.x, d.y, -d.rotation)
  const dx = local.x - d.x
  const dy = local.y - d.y
  const rx = d.w / 2
  const ry = d.h / 2
  if (rx <= 0 || ry <= 0) return false

  switch (d.kind) {
    case 'circle':
      return (dx / rx) ** 2 + (dy / ry) ** 2 <= 1
    case 'rect':
      return Math.abs(dx) <= rx && Math.abs(dy) <= ry
    case 'triangle': {
      // apex at top-center, base across the bottom
      const u = (local.x - (d.x - rx)) / d.w // 0..1 across
      const v = (local.y - (d.y - ry)) / d.h // 0..1 down
      if (v < 0 || v > 1) return false
      const halfAtV = v / 2 // widens toward the base
      return u >= 0.5 - halfAtV && u <= 0.5 + halfAtV
    }
    case 'star':
      // approximate footprint with the inscribed ellipse — plenty for sampling
      return (dx / rx) ** 2 + (dy / ry) ** 2 <= 1
    default:
      return false
  }
}

/**
 * Returns the fill color at a normalized point, walking decorations from top
 * (last drawn) to bottom, falling back to the garment base color.
 */
export function colorAtPoint(layer: DesignLayer, px: number, py: number): string {
  for (let i = layer.decorations.length - 1; i >= 0; i--) {
    const d = layer.decorations[i]
    if (decorationContains(d, px, py)) return d.fill
  }
  return layer.baseColor
}

/** SVG `points`/`d` string builders (in a 0..1 viewBox). */
export function trianglePoints(d: Decoration): string {
  const rx = d.w / 2
  const ry = d.h / 2
  const p = [
    { x: d.x, y: d.y - ry },
    { x: d.x - rx, y: d.y + ry },
    { x: d.x + rx, y: d.y + ry },
  ]
  return p.map((q) => `${q.x},${q.y}`).join(' ')
}

export function starPoints(d: Decoration, spikes = 5): string {
  const rx = d.w / 2
  const ry = d.h / 2
  const inner = 0.42
  const pts: string[] = []
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (Math.PI / spikes) * i - Math.PI / 2
    const r = i % 2 === 0 ? 1 : inner
    pts.push(`${d.x + Math.cos(ang) * rx * r},${d.y + Math.sin(ang) * ry * r}`)
  }
  return pts.join(' ')
}

export function pathD(points: Vec2[]): string {
  if (points.length === 0) return ''
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')
}

export const SHAPE_LIBRARY: { kind: ShapeKind; label: string }[] = [
  { kind: 'circle', label: 'Circle' },
  { kind: 'rect', label: 'Square' },
  { kind: 'triangle', label: 'Triangle' },
  { kind: 'star', label: 'Star' },
  { kind: 'line', label: 'Line' },
  { kind: 'path', label: 'Brush' },
]
