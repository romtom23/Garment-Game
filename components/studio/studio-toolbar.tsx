'use client'

import { Brush, Eraser, PaintBucket, Trash2 } from 'lucide-react'
import type { GarmentType } from '@/lib/types'
import { PALETTE, stylesFor, GARMENT_LABEL } from '@/lib/garments'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Tool = 'paint' | 'erase' | 'fill'

type Props = {
  garment: GarmentType
  variant: string
  color: string
  tool: Tool
  baseColor: string
  onTool: (t: Tool) => void
  onColor: (c: string) => void
  onVariant: (v: string) => void
  onBaseColor: (c: string) => void
  onClear: () => void
}

const TOOLS: { id: Tool; label: string; icon: typeof Brush }[] = [
  { id: 'paint', label: 'Brush', icon: Brush },
  { id: 'fill', label: 'Fill', icon: PaintBucket },
  { id: 'erase', label: 'Eraser', icon: Eraser },
]

export function StudioToolbar({
  garment,
  variant,
  color,
  tool,
  baseColor,
  onTool,
  onColor,
  onVariant,
  onBaseColor,
  onClear,
}: Props) {
  const styles = stylesFor(garment)

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
        <div className="flex gap-2">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTool(t.id)}
              aria-pressed={tool === t.id}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition-colors',
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
        <p className="mb-2 text-sm font-bold text-foreground">Colors</p>
        <div className="grid grid-cols-6 gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => onColor(c)}
              aria-label={`Select color ${c}`}
              className={cn(
                'aspect-square rounded-lg border-2 transition-transform hover:scale-105',
                color === c
                  ? 'border-foreground ring-2 ring-primary ring-offset-2 ring-offset-card'
                  : 'border-border',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/40 p-3">
        <div>
          <p className="text-sm font-bold text-foreground">Base color</p>
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
            aria-label="Base color"
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
