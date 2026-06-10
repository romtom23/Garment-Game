'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DesignLayer, PaintCell } from '@/lib/types'
import { GRID } from '@/lib/garments'
import { buildMask } from '@/lib/shapes'

type Tool = 'paint' | 'erase' | 'fill'

type Props = {
  layer: DesignLayer
  color: string
  tool: Tool
  onChange: (cells: PaintCell[]) => void
}

const CANVAS = 460 // px, square drawing area

export function PaintCanvas({ layer, color, tool, onChange }: Props) {
  const { cols, rows } = GRID[layer.garment]
  const mask = useMemo(
    () => buildMask(layer.garment, layer.variant),
    [layer.garment, layer.variant],
  )

  // local map of painted cells for fast updates while dragging
  const [cellMap, setCellMap] = useState<Map<number, string>>(new Map())
  const cellMapRef = useRef(cellMap)
  cellMapRef.current = cellMap
  const drawing = useRef(false)

  // sync incoming layer.cells -> local map (e.g. wizard edits, layer switch)
  useEffect(() => {
    const m = new Map<number, string>()
    for (const c of layer.cells) m.set(c.i, c.color)
    setCellMap(m)
  }, [layer.cells, layer.garment, layer.variant])

  const cellW = CANVAS / cols
  const cellH = CANVAS / rows

  const commit = useCallback(
    (m: Map<number, string>) => {
      const cells: PaintCell[] = Array.from(m, ([i, color]) => ({ i, color }))
      onChange(cells)
    },
    [onChange],
  )

  const applyAt = useCallback(
    (clientX: number, clientY: number, rect: DOMRect, persist: boolean) => {
      const c = Math.floor(((clientX - rect.left) / rect.width) * cols)
      const r = Math.floor(((clientY - rect.top) / rect.height) * rows)
      if (c < 0 || c >= cols || r < 0 || r >= rows) return
      const i = r * cols + c
      if (!mask[i]) return

      const next = new Map(cellMapRef.current)
      if (tool === 'erase') next.delete(i)
      else if (tool === 'fill') {
        for (let k = 0; k < mask.length; k++) if (mask[k]) next.set(k, color)
      } else next.set(i, color)

      cellMapRef.current = next
      setCellMap(next)
      if (persist) commit(next)
    },
    [cols, rows, mask, tool, color, commit],
  )

  const pointer = (e: React.PointerEvent<HTMLDivElement>, persist = false) => {
    const rect = e.currentTarget.getBoundingClientRect()
    applyAt(e.clientX, e.clientY, rect, persist)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative touch-none select-none rounded-2xl border-2 border-border bg-[var(--paper)] shadow-inner"
        style={
          {
            width: CANVAS,
            height: CANVAS,
            maxWidth: '100%',
            '--paper': 'oklch(0.99 0.01 95)',
          } as React.CSSProperties
        }
        onPointerDown={(e) => {
          drawing.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          pointer(e)
        }}
        onPointerMove={(e) => {
          if (drawing.current) pointer(e)
        }}
        onPointerUp={(e) => {
          drawing.current = false
          pointer(e, true)
        }}
        onPointerCancel={() => {
          drawing.current = false
          commit(cellMap)
        }}
        role="img"
        aria-label={`Paint canvas for ${layer.garment}`}
      >
        <svg
          width={CANVAS}
          height={CANVAS}
          viewBox={`0 0 ${CANVAS} ${CANVAS}`}
          className="absolute inset-0 h-full w-full"
        >
          {/* garment silhouette + painted cells */}
          {Array.from({ length: cols * rows }, (_, i) => {
            if (!mask[i]) return null
            const c = i % cols
            const r = Math.floor(i / cols)
            const fill = cellMap.get(i) ?? layer.baseColor
            return (
              <rect
                key={i}
                x={c * cellW}
                y={r * cellH}
                width={cellW + 0.5}
                height={cellH + 0.5}
                fill={fill}
              />
            )
          })}
          {/* subtle grid overlay */}
          {Array.from({ length: cols * rows }, (_, i) => {
            if (!mask[i]) return null
            const c = i % cols
            const r = Math.floor(i / cols)
            return (
              <rect
                key={`g${i}`}
                x={c * cellW}
                y={r * cellH}
                width={cellW}
                height={cellH}
                fill="none"
                stroke="oklch(0.31 0.04 52 / 0.06)"
                strokeWidth={1}
              />
            )
          })}
        </svg>
      </div>
      <p className="text-xs font-semibold text-muted-foreground">
        {tool === 'fill'
          ? 'Tap to flood-fill the whole garment'
          : tool === 'erase'
            ? 'Tap or drag to erase back to the base color'
            : 'Tap or drag to paint cells'}
      </p>
    </div>
  )
}
