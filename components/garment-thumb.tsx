import type { DesignLayer } from '@/lib/types'
import { silhouettePaths } from '@/lib/silhouettes'
import { DecorationShape } from '@/components/studio/decoration-shape'

/**
 * Lightweight 2D SVG preview of a garment layer. Draws the smooth vector
 * garment silhouette, then layers the vector decorations on top, clipped to
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
  const paths = silhouettePaths(layer.garment, layer.variant)
  const clipId = `thumb-clip-${layer.garment}-${layer.variant}`

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
          {paths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x={0} y={0} width={1} height={1} fill={layer.baseColor} />
        {layer.decorations.map((d) => (
          <DecorationShape key={d.id} d={d} />
        ))}
      </g>
      {paths.map((d, i) => (
        <path
          key={`o-${i}`}
          d={d}
          fill="none"
          stroke="oklch(0.45 0.03 80 / 0.4)"
          strokeWidth={0.008}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
