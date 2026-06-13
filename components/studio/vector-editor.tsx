'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import type { Decoration, DesignLayer, ShapeKind } from '@/lib/types'
import { silhouettePaths } from '@/lib/silhouettes'
import { decorationContains, makeDecoration } from '@/lib/decorations'
import { DecorationShape } from './decoration-shape'

export type EditorTool = 'select' | ShapeKind

type Props = {
  layer: DesignLayer
  tool: EditorTool
  color: string
  stroke: string
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (decorations: Decoration[]) => void
  onToolHandled: () => void
}

const CANVAS = 460

type DragMode =
  | { type: 'move'; id: string; startX: number; startY: number; ox: number; oy: number }
  | {
      type: 'resize'
      id: string
      ow: number
      oh: number
      cx: number
      cy: number
      startX: number
      startY: number
    }
  | {
      type: 'rotate'
      id: string
      cx: number
      cy: number
      startAngle: number
      orot: number
    }
  | { type: 'draw'; id: string }
  | null

export function VectorEditor({
  layer,
  tool,
  color,
  stroke,
  selectedId,
  onSelect,
  onChange,
  onToolHandled,
}: Props) {
  const paths = useMemo(
    () => silhouettePaths(layer.garment, layer.variant),
    [layer.garment, layer.variant],
  )
  const clipId = `edit-clip-${layer.garment}-${layer.variant}`

  const decosRef = useRef(layer.decorations)
  decosRef.current = layer.decorations
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<DragMode>(null)

  const selected = layer.decorations.find((d) => d.id === selectedId) ?? null

  /** Convert a pointer event to normalized 0..1 coordinates within the SVG. */
  const toNorm = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    }
  }, [])

  const commit = useCallback(
    (next: Decoration[]) => {
      decosRef.current = next
      onChange(next)
    },
    [onChange],
  )

  const patchSelected = useCallback(
    (id: string, patch: Partial<Decoration>) => {
      commit(
        decosRef.current.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      )
    },
    [commit],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const { x, y } = toNorm(e.clientX, e.clientY)
      svgRef.current?.setPointerCapture(e.pointerId)

      if (tool === 'select') {
        // hit test from topmost to bottom
        for (let i = decosRef.current.length - 1; i >= 0; i--) {
          const d = decosRef.current[i]
          if (decorationContains(d, x, y)) {
            onSelect(d.id)
            drag.current = {
              type: 'move',
              id: d.id,
              startX: x,
              startY: y,
              ox: d.x,
              oy: d.y,
            }
            return
          }
        }
        onSelect(null)
        return
      }

      // shape tools
      if (tool === 'path' || tool === 'line') {
        const deco = makeDecoration(tool, x, y, color, stroke)
        deco.points = [{ x, y }]
        if (tool === 'line') deco.points = [{ x, y }, { x, y }]
        const next = [...decosRef.current, deco]
        commit(next)
        onSelect(deco.id)
        drag.current = { type: 'draw', id: deco.id }
        return
      }

      // circle / rect / triangle / star — place at click
      const deco = makeDecoration(tool, x, y, color, stroke)
      const next = [...decosRef.current, deco]
      commit(next)
      onSelect(deco.id)
      onToolHandled()
      // allow immediate drag to position
      drag.current = {
        type: 'move',
        id: deco.id,
        startX: x,
        startY: y,
        ox: deco.x,
        oy: deco.y,
      }
    },
    [tool, color, stroke, toNorm, commit, onSelect, onToolHandled],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const d = drag.current
      if (!d) return
      const { x, y } = toNorm(e.clientX, e.clientY)

      if (d.type === 'move') {
        patchSelected(d.id, {
          x: clamp(d.ox + (x - d.startX)),
          y: clamp(d.oy + (y - d.startY)),
        })
      } else if (d.type === 'resize') {
        const nw = Math.max(0.03, Math.abs(x - d.cx) * 2)
        const nh = Math.max(0.03, Math.abs(y - d.cy) * 2)
        patchSelected(d.id, { w: nw, h: nh })
      } else if (d.type === 'rotate') {
        const ang = (Math.atan2(y - d.cy, x - d.cx) * 180) / Math.PI
        patchSelected(d.id, { rotation: Math.round(d.orot + (ang - d.startAngle)) })
      } else if (d.type === 'draw') {
        const target = decosRef.current.find((dd) => dd.id === d.id)
        if (!target) return
        if (target.kind === 'line') {
          const pts = target.points ?? []
          patchSelected(d.id, { points: [pts[0], { x, y }] })
        } else {
          const pts = [...(target.points ?? []), { x, y }]
          patchSelected(d.id, { points: pts })
        }
      }
    },
    [toNorm, patchSelected],
  )

  const endDrag = useCallback(() => {
    drag.current = null
    onToolHandled()
  }, [onToolHandled])

  // selection box geometry (in normalized units)
  const box = selected
    ? {
        x: selected.x - selected.w / 2,
        y: selected.y - selected.h / 2,
        w: selected.w,
        h: selected.h,
      }
    : null

  const startResize = (e: React.PointerEvent) => {
    if (!selected) return
    e.stopPropagation()
    svgRef.current?.setPointerCapture(e.pointerId)
    drag.current = {
      type: 'resize',
      id: selected.id,
      ow: selected.w,
      oh: selected.h,
      cx: selected.x,
      cy: selected.y,
      startX: 0,
      startY: 0,
    }
  }

  const startRotate = (e: React.PointerEvent) => {
    if (!selected) return
    e.stopPropagation()
    svgRef.current?.setPointerCapture(e.pointerId)
    const { x, y } = toNorm(e.clientX, e.clientY)
    drag.current = {
      type: 'rotate',
      id: selected.id,
      cx: selected.x,
      cy: selected.y,
      startAngle: (Math.atan2(y - selected.y, x - selected.x) * 180) / Math.PI,
      orot: selected.rotation,
    }
  }

  const cursor =
    tool === 'select' ? 'default' : tool === 'path' ? 'crosshair' : 'copy'

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        ref={svgRef}
        width={CANVAS}
        height={CANVAS}
        viewBox="0 0 1 1"
        className="touch-none select-none rounded-2xl border-2 border-border shadow-inner"
        style={{
          width: CANVAS,
          height: CANVAS,
          maxWidth: '100%',
          background: 'oklch(0.99 0.01 95)',
          cursor,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="img"
        aria-label={`Vector editor for ${layer.garment}`}
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            {paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </clipPath>
        </defs>

        {/* soft drop shadow + faint silhouette so the wearable area reads */}
        <g opacity={0.18}>
          {paths.map((d, i) => (
            <path key={i} d={d} fill="oklch(0.7 0.04 80)" />
          ))}
        </g>

        {/* fabric + decorations, clipped to the smooth garment outline */}
        <g clipPath={`url(#${clipId})`}>
          <rect x={0} y={0} width={1} height={1} fill={layer.baseColor} />
          {layer.decorations.map((d) => (
            <DecorationShape key={d.id} d={d} />
          ))}
        </g>

        {/* crisp outline stroke around the garment */}
        {paths.map((d, i) => (
          <path
            key={`o-${i}`}
            d={d}
            fill="none"
            stroke="oklch(0.45 0.03 80 / 0.45)"
            strokeWidth={0.006}
            strokeLinejoin="round"
          />
        ))}

        {/* selection overlay (not clipped) */}
        {box && selected && (
          <g
            transform={`rotate(${selected.rotation} ${selected.x} ${selected.y})`}
          >
            <rect
              x={box.x}
              y={box.y}
              width={box.w}
              height={box.h}
              fill="none"
              stroke="oklch(0.55 0.18 250)"
              strokeWidth={0.004}
              strokeDasharray="0.02 0.012"
            />
            {/* resize handle (bottom-right) */}
            <circle
              cx={box.x + box.w}
              cy={box.y + box.h}
              r={0.018}
              fill="oklch(0.55 0.18 250)"
              style={{ cursor: 'nwse-resize' }}
              onPointerDown={startResize}
            />
            {/* rotate handle (top-center) */}
            <line
              x1={selected.x}
              y1={box.y}
              x2={selected.x}
              y2={box.y - 0.06}
              stroke="oklch(0.55 0.18 250)"
              strokeWidth={0.004}
            />
            <circle
              cx={selected.x}
              cy={box.y - 0.06}
              r={0.018}
              fill="oklch(0.99 0.01 95)"
              stroke="oklch(0.55 0.18 250)"
              strokeWidth={0.004}
              style={{ cursor: 'grab' }}
              onPointerDown={startRotate}
            />
          </g>
        )}
      </svg>
      <p className="text-center text-xs font-semibold text-muted-foreground">
        {tool === 'select'
          ? selected
            ? 'Drag to move • corner to resize • top dot to rotate'
            : 'Tap a shape to select it'
            : tool === 'path'
              ? 'Click and drag to paint a freehand stroke'
            : tool === 'line'
              ? 'Click and drag to draw a line'
              : 'Click on the garment to place the shape'}
      </p>
    </div>
  )
}

function clamp(n: number) {
  return Math.max(0, Math.min(1, n))
}
