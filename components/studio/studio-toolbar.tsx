'use client'

import {
  MousePointer2,
  Circle,
  Square,
  Triangle,
  Star,
  Minus,
  Brush,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import type { Decoration, GarmentType } from '@/lib/types'
import { PALETTE, stylesFor, GARMENT_LABEL } from '@/lib/garments'
import type { EditorTool } from './vector-editor'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  garment: GarmentType
  variant: string
  color: string
  tool: EditorTool
  baseColor: string
  selected: Decoration | null
  onTool: (t: EditorTool) => void
  onColor: (c: string) => void
  onVariant: (v: string) => void
  onBaseColor: (c: string) => void
  onClear: () => void
  onUpdateSelected: (patch: Partial<Decoration>) => void
  onDeleteSelected: () => void
  onDuplicateSelected: () => void
  onReorderSelected: (dir: 'up' | 'down') => void
}

const TOOLS: { id: EditorTool; label: string; icon: typeof Circle }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'rect', label: 'Square', icon: Square },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
  { id: 'star', label: 'Star', icon: Star },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'brush', label: 'Brush', icon: Brush },
]

export function StudioToolbar({
  garment,
  variant,
  color,
  tool,
  baseColor,
  selected,
  onTool,
  onColor,
  onVariant,
  onBaseColor,
  onClear,
  onUpdateSelected,
  onDeleteSelected,
  onDuplicateSelected,
  onReorderSelected,
}: Props) {
  const styles = stylesFor(garment)
  // When a shape is selected, the palette recolors it; otherwise it sets the
  // color used for the next shape you draw.
  const activeColor = selected ? selected.fill : color
  const pickColor = (c: string) => {
    if (selected) onUpdateSelected({ fill: c })
    else onColor(c)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm font-bold text-foreground">
          {GARMENT_LABEL[garment]} style
        </p>
        <div className="flex flex-wrap gap-2">
          {styles.map((s) => (
            <button
              key={s.id}
              onClick={() => onVariant(s.variant)}
              className={cn(
                'rounded-xl border-2 px-3 py-1.5 text-sm font-semibold transition-colors',
                variant === s.variant
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50',
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-foreground">Tools</p>
        <div className="grid grid-cols-4 gap-2">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTool(t.id)}
              aria-pressed={tool === t.id}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-[11px] font-semibold transition-colors',
                tool === t.id
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50',
              )}
            >
              <t.icon className="size-5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-foreground">
          {selected ? 'Shape color' : 'Paint color'}
        </p>
        <div className="grid grid-cols-6 gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => pickColor(c)}
              aria-label={`Select color ${c}`}
              className={cn(
                'aspect-square rounded-lg border-2 transition-transform hover:scale-105',
                activeColor === c
                  ? 'border-foreground ring-2 ring-primary ring-offset-2 ring-offset-card'
                  : 'border-border',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Selected-shape controls */}
      {selected && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-3">
          <p className="text-sm font-bold text-foreground">Selected shape</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Outline
            </span>
            <label className="relative size-8 cursor-pointer overflow-hidden rounded-lg border-2 border-border">
              <span
                className="block size-full"
                style={{ backgroundColor: selected.stroke }}
              />
              <input
                type="color"
                value={selected.stroke}
                onChange={(e) => onUpdateSelected({ stroke: e.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Outline color"
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Outline width
            </span>
            <input
              type="range"
              min={0}
              max={0.04}
              step={0.002}
              value={selected.strokeWidth}
              onChange={(e) =>
                onUpdateSelected({ strokeWidth: Number(e.target.value) })
              }
              className="flex-1 accent-primary"
              aria-label="Outline width"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="font-semibold"
              onClick={onDuplicateSelected}
            >
              <Copy className="size-4" />
              Duplicate
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="font-semibold"
              onClick={() => onReorderSelected('up')}
              aria-label="Bring forward"
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="font-semibold"
              onClick={() => onReorderSelected('down')}
              aria-label="Send backward"
            >
              <ArrowDown className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDeleteSelected}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/40 p-3">
        <div>
          <p className="text-sm font-bold text-foreground">Fabric color</p>
          <p className="text-xs text-muted-foreground">
            Fills the whole garment
          </p>
        </div>
        <label className="relative size-10 cursor-pointer overflow-hidden rounded-xl border-2 border-border">
          <span
            className="block size-full"
            style={{ backgroundColor: baseColor }}
          />
          <input
            type="color"
            value={baseColor}
            onChange={(e) => onBaseColor(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Fabric color"
          />
        </label>
      </div>

      <Button
        variant="ghost"
        onClick={onClear}
        className="justify-start font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
        Clear this garment
      </Button>
    </div>
  )
}
