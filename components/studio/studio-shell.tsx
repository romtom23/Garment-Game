'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Share2,
  Wand2,
  Loader2,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  Decoration,
  Design,
  DesignLayer,
  GarmentType,
} from '@/lib/types'
import { GARMENT_LABEL } from '@/lib/garments'
import { saveDesign, publishDesign } from '@/app/actions/designs'
import { addToCart } from '@/app/actions/cart'
import { priceDesign, formatUSD } from '@/lib/pricing'
import { uid, makeDecoration } from '@/lib/decorations'
import { loadImageMeta } from '@/lib/image-meta'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VectorEditor, type EditorTool } from './vector-editor'
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

const GARMENTS: GarmentType[] = ['head', 'shirt', 'sweatpants']

export function StudioShell({ initialDesign }: { initialDesign: Design }) {
  const router = useRouter()
  const [design, setDesign] = useState<Design>(initialDesign)
  const [active, setActive] = useState<GarmentType>('head')
  const [tool, setTool] = useState<EditorTool>('select')
  const [color, setColor] = useState('#e8705a')
  const [stroke, setStroke] = useState('#2b2b2b')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'draw' | '3d'>('draw')
  const [playKey, setPlayKey] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [addingId, setAddingId] = useState<GarmentType | null>(null)
  const [uploading, setUploading] = useState(false)

  const activeLayer = useMemo(
    () => design.layers.find((l) => l.garment === active)!,
    [design.layers, active],
  )

  const selected =
    activeLayer.decorations.find((d) => d.id === selectedId) ?? null

  const price = useMemo(() => priceDesign(design), [design])

  // Debounced autosave to the database whenever the design changes.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void saveDesign({
        id: design.id,
        title: design.title,
        layers: design.layers,
      }).catch(() => {})
    }, 700)
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

  const handleDecorations = useCallback(
    (decorations: Decoration[]) =>
      updateLayer(active, { decorations }),
    [active, updateLayer],
  )

  const updateSelected = useCallback(
    (patch: Partial<Decoration>) => {
      if (!selectedId) return
      updateLayer(active, {
        decorations: activeLayer.decorations.map((d) =>
          d.id === selectedId ? { ...d, ...patch } : d,
        ),
      })
    },
    [active, activeLayer.decorations, selectedId, updateLayer],
  )

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    updateLayer(active, {
      decorations: activeLayer.decorations.filter((d) => d.id !== selectedId),
    })
    setSelectedId(null)
  }, [active, activeLayer.decorations, selectedId, updateLayer])

  const duplicateSelected = useCallback(() => {
    if (!selected) return
    const copy: Decoration = {
      ...selected,
      id: uid(),
      x: Math.min(0.95, selected.x + 0.05),
      y: Math.min(0.95, selected.y + 0.05),
      points: selected.points?.map((p) => ({
        x: Math.min(1, p.x + 0.05),
        y: Math.min(1, p.y + 0.05),
      })),
    }
    updateLayer(active, { decorations: [...activeLayer.decorations, copy] })
    setSelectedId(copy.id)
  }, [active, activeLayer.decorations, selected, updateLayer])

  const reorderSelected = useCallback(
    (dir: 'up' | 'down') => {
      if (!selectedId) return
      const list = [...activeLayer.decorations]
      const i = list.findIndex((d) => d.id === selectedId)
      if (i < 0) return
      const j = dir === 'up' ? i + 1 : i - 1
      if (j < 0 || j >= list.length) return
      ;[list[i], list[j]] = [list[j], list[i]]
      updateLayer(active, { decorations: list })
    },
    [active, activeLayer.decorations, selectedId, updateLayer],
  )

  const handleUploadImage = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        const body = new FormData()
        body.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')

        const { aspect, avgColor } = await loadImageMeta(data.url)
        // Fit the image inside a ~0.42 normalized box, preserving aspect ratio.
        const maxDim = 0.42
        const w = aspect >= 1 ? maxDim : maxDim * aspect
        const h = aspect >= 1 ? maxDim / aspect : maxDim
        const deco = makeDecoration('image', 0.5, 0.5, avgColor, '#00000000', {
          src: data.url,
          w,
          h,
        })
        setView('draw')
        updateLayer(active, {
          decorations: [...activeLayer.decorations, deco],
        })
        setTool('select')
        setSelectedId(deco.id)
        toast.success('Image added to your design')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [active, activeLayer.decorations, updateLayer],
  )

  const bringToLife = useCallback(() => {
    setView('3d')
    setPlayKey((k) => k + 1)
  }, [])

  const handleSave = useCallback(async () => {
    await saveDesign({
      id: design.id,
      title: design.title,
      layers: design.layers,
    })
    toast.success('Design saved')
  }, [design])

  const handlePublish = useCallback(async () => {
    setPublishing(true)
    try {
      await saveDesign({
        id: design.id,
        title: design.title,
        layers: design.layers,
      })
      const published = await publishDesign(design.id)
      setDesign((d) => ({ ...d, published: true, slug: published.slug }))
      toast.success('Shop published!')
      router.push(`/shop/${published.slug}`)
    } catch {
      toast.error('Could not publish. Try again.')
    } finally {
      setPublishing(false)
    }
  }, [design, router])

  const handleAddToCart = useCallback(
    async (garment: GarmentType) => {
      setAddingId(garment)
      const layer = design.layers.find((l) => l.garment === garment)!
      try {
        await saveDesign({
          id: design.id,
          title: design.title,
          layers: design.layers,
        })
        await addToCart({
          designId: design.id,
          designTitle: design.title,
          layer,
        })
        toast.success(`${GARMENT_LABEL[garment]} added to cart`)
      } catch {
        toast.error('Could not add to cart')
      } finally {
        setAddingId(null)
      }
    },
    [design],
  )

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
              setSelectedId(null)
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
            selected={selected}
            onTool={(t) => {
              setTool(t)
              if (t !== 'select') setSelectedId(null)
            }}
            onColor={setColor}
            onVariant={(v) => updateLayer(active, { variant: v })}
            onBaseColor={(c) => updateLayer(active, { baseColor: c })}
            onClear={() => {
              updateLayer(active, { decorations: [] })
              setSelectedId(null)
            }}
            onUpdateSelected={updateSelected}
            onDeleteSelected={deleteSelected}
            onDuplicateSelected={duplicateSelected}
            onReorderSelected={reorderSelected}
            onUploadImage={handleUploadImage}
            uploading={uploading}
          />
        </aside>

        {/* center: canvas / 3d */}
        <section className="order-1 flex flex-col rounded-3xl border border-border bg-card p-5 shadow-sm lg:order-2">
          <div className="mb-4 flex items-center justify-center gap-2">
            <ToggleChip
              active={view === 'draw'}
              onClick={() => setView('draw')}
            >
              Design
            </ToggleChip>
            <ToggleChip active={view === '3d'} onClick={() => setView('3d')}>
              3D Preview
            </ToggleChip>
          </div>

          <div className="flex flex-1 items-center justify-center">
            {view === 'draw' ? (
              <VectorEditor
                layer={activeLayer}
                tool={tool}
                color={color}
                stroke={stroke}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onChange={handleDecorations}
                onToolHandled={() => setTool('select')}
              />
            ) : (
              <div className="h-[460px] w-full">
                <GarmentViewer layer={activeLayer} playKey={playKey} />
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              size="lg"
              variant="secondary"
              onClick={bringToLife}
              className="font-semibold shadow-sm"
            >
              <Wand2 className="size-5" />
              Bring it to life
            </Button>
            <Button
              size="lg"
              onClick={() => handleAddToCart(active)}
              disabled={addingId === active}
              className="font-semibold shadow-md"
            >
              {addingId === active ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ShoppingBag className="size-5" />
              )}
              Add {GARMENT_LABEL[active]} — {formatUSD(
                price.perGarment.find((g) => g.garment === active)?.total ?? 0,
              )}
            </Button>
          </div>
        </section>

        {/* right: AI wizard */}
        <aside className="order-3 flex flex-col rounded-3xl border border-border bg-card p-0 shadow-sm">
          <WizardPanel
            layer={activeLayer}
            color={color}
            onApply={(patch) => {
              updateLayer(active, patch)
              setSelectedId(null)
            }}
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
