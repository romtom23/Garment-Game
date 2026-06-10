import type { DesignLayer } from '@/lib/types'
import { GRID } from '@/lib/garments'
import { buildMask } from '@/lib/shapes'

/**
 * Lightweight 2D SVG preview of a garment layer. Shares the same silhouette
 * masks as the canvas and 3D renderer, so thumbnails match the live design.
 */
export function GarmentThumb({
  layer,
  size = 160,
  className,
}: {
  layer: DesignLayer
  size?: number
  className?: string
}) {
  const { cols, rows } = GRID[layer.garment]
  const mask = buildMask(layer.garment, layer.variant)
  const colorMap = new Map<number, string>()
  for (const c of layer.cells) colorMap.set(c.i, c.color)

  const cellW = size / cols
  const cellH = size / rows

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={`${layer.garment} preview`}
    >
      {Array.from({ length: cols * rows }, (_, i) => {
        if (!mask[i]) return null
        const c = i % cols
        const r = Math.floor(i / cols)
        const fill = colorMap.get(i) ?? layer.baseColor
        return (
          <rect
            key={i}
            x={c * cellW}
            y={r * cellH}
            width={cellW + 0.6}
            height={cellH + 0.6}
            fill={fill}
          />
        )
      })}
    </svg>
  )
}
