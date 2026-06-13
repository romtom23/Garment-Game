import type { Decoration } from '@/lib/types'
import { pathD, starPoints, trianglePoints } from '@/lib/decorations'

/**
 * Renders a single decoration inside a 0..1 normalized SVG viewBox. Used by the
 * thumbnail, the live editor, and the public shop preview so a design looks
 * identical everywhere.
 */
export function DecorationShape({ d }: { d: Decoration }) {
  const common = {
    fill: d.fill,
    stroke: d.stroke,
    strokeWidth: d.strokeWidth,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  }
  const transform = d.rotation
    ? `rotate(${d.rotation} ${d.x} ${d.y})`
    : undefined

  switch (d.kind) {
    case 'circle':
      return (
        <ellipse
          cx={d.x}
          cy={d.y}
          rx={d.w / 2}
          ry={d.h / 2}
          transform={transform}
          {...common}
        />
      )
    case 'rect':
      return (
        <rect
          x={d.x - d.w / 2}
          y={d.y - d.h / 2}
          width={d.w}
          height={d.h}
          rx={Math.min(d.w, d.h) * 0.12}
          transform={transform}
          {...common}
        />
      )
    case 'triangle':
      return (
        <polygon points={trianglePoints(d)} transform={transform} {...common} />
      )
    case 'star':
      return (
        <polygon points={starPoints(d)} transform={transform} {...common} />
      )
    case 'line':
    case 'path': {
      const pts = d.points ?? []
      if (pts.length < 2) return null
      return (
        <path
          d={pathD(pts)}
          fill="none"
          stroke={d.fill}
          strokeWidth={d.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    }
    default:
      return null
  }
}
