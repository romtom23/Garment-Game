'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Save,
  Share2,
  Wand2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Design, DesignLayer, GarmentType, PaintCell } from '@/lib/types'
import { GARMENT_LABEL } from '@/lib/garments'
import { saveDesign, publishDesign } from '@/lib/storage'
import { priceDesign, formatUSD } from '@/lib/pricing'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PaintCanvas } from './paint-canvas'
import { StudioToolbar } from './studio-toolbar'
import { WizardPanel } from './wizard-panel'

const GarmentViewer = dynamic(
  () => import('./garment-viewer').then((m) => m.GarmentViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    ),
  },
)

type Tool = 'paint' | 'erase' | 'fill'

const GARMENTS: GarmentType[] = ['head', 'shirt', 'sweatpants']

export function StudioShell({ initialDesign }: { initialDesign: Design }) {
  const router = useRouter()
  const { user } = useAuth()
  const [design, setDesign] = useState<Design>(initialDesign)
  const [active, setActive] = useState<GarmentType>('head')
  const [tool, setTool] = useState<Tool>('paint')
  const [color, setColor] = useState('#e8705a')
  const [view, setView] = useState<'draw' | '3d'>('draw')
  const [playKey, setPlayKey] = useState(0)
  const [publishing, setPublishing] = useState(false)

  const activeLayer = useMemo(
    () => design.layers.find((l) => l.garment === active)!,
    [design.layers, active],
  )

  const price = useMemo(() => priceDesign(design), [design])

  // autosave (debounced) whenever the design changes
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDesign(design), 600)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [design])

  const updateLayer = useCallback(
    (garment: GarmentType, patch: Partial<DesignLayer>) => {
      setDesign((d) => ({
        ...d,
        layers: d.layers.map((l) =>
          l.garment === garment ? { ...l, ...patch } : l,
        ),
      }))
    },
    [],
  )

  const handleCells = useCallback(
    (cells: PaintCell[]) => updateLayer(active, { cells }),
    [active, updateLayer],
  )

  const bringToLife = useCallback(() => {
    setView('3d')
    setPlayKey((k) => k + 1)
  }, [])

  const handleSave = useCallback(() => {
    saveDesign(design)
    toast.success('Design saved')
  }, [design])

  const handlePublish = useCallback(() => {
    setPublishing(true)
    const published = publishDesign(design.id)
    setPublishing(false)
    if (published) {
      setDesign(published)
      toast.success('Shop published!')
      router.push(`/shop/${published.slug}`)
    }
  }, [design.id, router])

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      {/* top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <Input
            value={design.title}
            onChange={(e) =>
              setDesign((d) => ({ ...d, title: e.target.value }))
            }
            className="h-9 w-40 border-transparent bg-transparent font-heading text-lg font-bold hover:border-border focus-visible:border-border sm:w-64"
            aria-label="Design title"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm font-semibold text-muted-foreground sm:inline">
            Est. {formatUSD(price.total)}
          </span>
          <Button
            variant="secondary"
            onClick={handleSave}
            className="font-semibold"
          >
            <Save className="size-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button
            onClick={handlePublish}
            disabled={publishing}
            className="font-semibold"
          >
            {publishing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Share2 className="size-4" />
            )}
            <span className="hidden sm:inline">Publish shop</span>
          </Button>
        </div>
      </header>

      {/* garment tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-background/60 px-4 py-2">
        {GARMENTS.map((g) => (
          <button
            key={g}
            onClick={() => {
              setActive(g)
              setView('draw')
            }}
            className={
              'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold transition-colors ' +
              (active === g
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground')
            }
          >
            {GARMENT_LABEL[g]}
          </button>
        ))}
      </div>

      {/* main 3-column workspace */}
      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[300px_1fr_330px]">
        {/* left: tools */}
        <aside className="order-2 rounded-3xl border border-border bg-card p-5 shadow-sm lg:order-1">
          <StudioToolbar
            garment={active}
            variant={activeLayer.variant}
            color={color}
            tool={tool}
            baseColor={activeLayer.baseColor}
            onTool={setTool}
            onColor={setColor}
            onVariant={(v) => updateLayer(active, { variant: v })}
            onBaseColor={(c) => updateLayer(active, { baseColor: c })}
            onClear={() => updateLayer(active, { cells: [] })}
          />
        </aside>

        {/* center: canvas / 3d */}
        <section className="order-1 flex flex-col rounded-3xl border border-border bg-card p-5 shadow-sm lg:order-2">
          <div className="mb-4 flex items-center justify-center gap-2">
            <ToggleChip
              active={view === 'draw'}
              onClick={() => setView('draw')}
            >
              Draw
            </ToggleChip>
            <ToggleChip active={view === '3d'} onClick={() => setView('3d')}>
              3D Preview
            </ToggleChip>
          </div>

          <div className="flex flex-1 items-center justify-center">
            {view === 'draw' ? (
              <PaintCanvas
                layer={activeLayer}
                color={color}
                tool={tool}
                onChange={handleCells}
              />
            ) : (
              <div className="h-[460px] w-full">
                <GarmentViewer layer={activeLayer} playKey={playKey} />
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              size="lg"
              onClick={bringToLife}
              className="font-semibold shadow-md"
            >
              <Wand2 className="size-5" />
              Bring it to life
            </Button>
          </div>
        </section>

        {/* right: AI wizard */}
        <aside className="order-3 flex flex-col rounded-3xl border border-border bg-card p-0 shadow-sm">
          <WizardPanel
            layer={activeLayer}
            onApply={(patch) => updateLayer(active, patch)}
          />
        </aside>
      </div>
    </div>
  )
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        'rounded-full px-4 py-1.5 text-sm font-bold transition-colors ' +
        (active
          ? 'bg-foreground text-background'
          : 'bg-secondary/60 text-muted-foreground hover:text-foreground')
      }
    >
      {children}
    </button>
  )
}
