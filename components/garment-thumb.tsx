import type { DesignLayer } from '@/lib/types'
import { GRID } from '@/lib/garments'
import { buildMask } from '@/lib/shapes'
import { DecorationShape } from '@/components/studio/decoration-shape'

/**
 * Lightweight 2D SVG preview of a garment layer. Draws the garment silhouette
 * from the shared mask, then layers the vector decorations on top, clipped to
 * the silhouette so paint never spills past the fabric edge.
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
  const clipId = `thumb-clip-${layer.garment}-${layer.variant}`

  // Build the silhouette as a set of normalized rects (one per filled cell).
  const cells: { x: number; y: number; w: number; h: number }[] = []
  for (let i = 0; i < cols * rows; i++) {
    if (!mask[i]) continue
    const c = i % cols
    const r = Math.floor(i / cols)
    cells.push({
      x: c / cols,
      y: r / rows,
      w: 1 / cols + 0.004,
      h: 1 / rows + 0.004,
    })
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1 1"
      className={className}
      role="img"
      aria-label={`${layer.garment} preview`}
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          {cells.map((c, i) => (
            <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} />
          ))}
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x={0} y={0} width={1} height={1} fill={layer.baseColor} />
        {layer.decorations.map((d) => (
          <DecorationShape key={d.id} d={d} />
        ))}
      </g>
    </svg>
  )
}
