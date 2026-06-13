import * as THREE from 'three'
import type { DesignLayer } from './types'
import { GRID } from './garments'
import { buildMask } from './shapes'
import { colorAtPoint } from './decorations'

// Builds a cohesive "pillow" geometry for a garment: the silhouette of grid
// cells puffed outward on both faces. Puff height is sampled at shared grid
// vertices so neighboring cells connect seamlessly (no gaps), and the open
// silhouette border is stitched closed with side walls.
// Per-cell colors become vertex colors so the painted design wraps the form.
export function buildGarmentGeometry(layer: DesignLayer): THREE.BufferGeometry {
  const { cols, rows } = GRID[layer.garment]
  const mask = buildMask(layer.garment, layer.variant)

  // Sample the vector decorations at each cell center to get its color. This
  // bakes the smooth 2D design onto the puffed grid mesh.
  const colorMap = new Map<number, string>()
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const i = cy * cols + cx
      if (!mask[i]) continue
      const px = (cx + 0.5) / cols
      const py = (cy + 0.5) / rows
      colorMap.set(i, colorAtPoint(layer, px, py))
    }
  }

  // ---- vertex grid: (cols+1) x (rows+1) ----
  const vCols = cols + 1
  const vRows = rows + 1
  const vIndex = (vx: number, vy: number) => vy * vCols + vx

  const cellAt = (cx: number, cy: number) =>
    cx < 0 || cy < 0 || cx >= cols || cy >= rows ? false : mask[cy * cols + cx]

  // A vertex is active if any of its up-to-4 surrounding cells is in the mask.
  const vActive = new Array<boolean>(vCols * vRows).fill(false)
  for (let vy = 0; vy < vRows; vy++) {
    for (let vx = 0; vx < vCols; vx++) {
      const active =
        cellAt(vx - 1, vy - 1) ||
        cellAt(vx, vy - 1) ||
        cellAt(vx - 1, vy) ||
        cellAt(vx, vy)
      vActive[vIndex(vx, vy)] = active
    }
  }

  // Distance of each active vertex to the nearest inactive (border) vertex,
  // via multi-source BFS. Border vertices get distance 0 so the puff tapers to
  // zero at the silhouette edge.
  const dist = new Array<number>(vCols * vRows).fill(-1)
  const queue: number[] = []
  for (let vy = 0; vy < vRows; vy++) {
    for (let vx = 0; vx < vCols; vx++) {
      const v = vIndex(vx, vy)
      if (!vActive[v]) {
        dist[v] = 0
        queue.push(v)
      }
    }
  }
  let head = 0
  while (head < queue.length) {
    const v = queue[head++]
    const vx = v % vCols
    const vy = Math.floor(v / vCols)
    const neighbors = [
      [vx - 1, vy],
      [vx + 1, vy],
      [vx, vy - 1],
      [vx, vy + 1],
    ]
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= vCols || ny >= vRows) continue
      const n = vIndex(nx, ny)
      if (dist[n] === -1) {
        dist[n] = dist[v] + 1
        queue.push(n)
      }
    }
  }
  const maxDist = Math.max(1, ...dist)

  // World sizing: fit roughly into a 2.4-tall box centered at origin.
  const aspect = cols / rows
  const worldH = 2.4
  const worldW = worldH * aspect
  const cellW = worldW / cols
  const cellH = worldH / rows
  const maxPuff = 0.6

  // puff height at a grid vertex (smooth dome that tapers to 0 at the edge)
  const puffAtVertex = (vx: number, vy: number) => {
    const d = dist[vIndex(vx, vy)]
    if (d <= 0) return 0
    const t = d / maxDist
    return maxPuff * Math.sin(Math.min(1, t) * Math.PI * 0.5)
  }

  const vpos = (vx: number, vy: number) => {
    const x = -worldW / 2 + vx * cellW
    const y = worldH / 2 - vy * cellH
    return { x, y }
  }

  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  let vertOffset = 0

  const base = new THREE.Color()
  const tmp = new THREE.Color()

  const pushVert = (x: number, y: number, z: number, col: THREE.Color) => {
    positions.push(x, y, z)
    colors.push(col.r, col.g, col.b)
  }

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      if (!mask[cy * cols + cx]) continue

      const hex = colorMap.get(cy * cols + cx) ?? layer.baseColor
      base.set(hex)
      tmp.copy(base).multiplyScalar(0.82)

      // four corners (top-left, top-right, bottom-right, bottom-left)
      const corners = [
        { vx: cx, vy: cy },
        { vx: cx + 1, vy: cy },
        { vx: cx + 1, vy: cy + 1 },
        { vx: cx, vy: cy + 1 },
      ]
      const cp = corners.map((c) => {
        const { x, y } = vpos(c.vx, c.vy)
        return { x, y, z: puffAtVertex(c.vx, c.vy) }
      })

      // front face (+z), CCW
      for (const p of cp) pushVert(p.x, p.y, p.z, base)
      indices.push(
        vertOffset,
        vertOffset + 2,
        vertOffset + 1,
        vertOffset,
        vertOffset + 3,
        vertOffset + 2,
      )
      vertOffset += 4

      // back face (-z), reversed winding, darker
      for (const p of cp) pushVert(p.x, p.y, -p.z, tmp)
      indices.push(
        vertOffset,
        vertOffset + 1,
        vertOffset + 2,
        vertOffset,
        vertOffset + 2,
        vertOffset + 3,
      )
      vertOffset += 4

      // side walls along edges that border outside the mask
      const edges = [
        { a: 0, b: 1, nx: cx, ny: cy - 1 }, // top
        { a: 1, b: 2, nx: cx + 1, ny: cy }, // right
        { a: 2, b: 3, nx: cx, ny: cy + 1 }, // bottom
        { a: 3, b: 0, nx: cx - 1, ny: cy }, // left
      ]
      for (const e of edges) {
        if (cellAt(e.nx, e.ny)) continue
        const pa = cp[e.a]
        const pb = cp[e.b]
        // quad: front a, front b, back b, back a
        pushVert(pa.x, pa.y, pa.z, base)
        pushVert(pb.x, pb.y, pb.z, base)
        pushVert(pb.x, pb.y, -pb.z, base)
        pushVert(pa.x, pa.y, -pa.z, base)
        indices.push(
          vertOffset,
          vertOffset + 1,
          vertOffset + 2,
          vertOffset,
          vertOffset + 2,
          vertOffset + 3,
        )
        vertOffset += 4
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  geo.center()
  return geo
}
