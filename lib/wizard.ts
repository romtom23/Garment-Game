import type { DesignLayer, PaintCell, WizardMessage } from './types'
import { GRID, PALETTE } from './garments'
import { buildMask } from './shapes'

// Mock "AI design wizard". It interprets a natural-language prompt and returns
// a friendly reply plus an optional patch to the active garment layer. This is
// isolated so it can later be replaced by a real model (e.g. fal for image gen
// + a text model for chat) without changing the WizardPanel UI.

export type WizardResult = {
  reply: string
  patch?: Partial<DesignLayer>
  suggestions?: string[]
}

const COLOR_WORDS: Record<string, string> = {
  red: '#e8705a',
  coral: '#e8705a',
  orange: '#f2a65a',
  peach: '#f2a65a',
  yellow: '#f2c14e',
  gold: '#f2c14e',
  green: '#7bc47f',
  leaf: '#7bc47f',
  teal: '#4f9d8f',
  blue: '#5a9bd4',
  sky: '#5a9bd4',
  navy: '#3b4a5a',
  slate: '#3b4a5a',
  brown: '#9b6a4a',
  cocoa: '#9b6a4a',
  cream: '#f6efe6',
  white: '#f6efe6',
  black: '#2b2b2b',
  ink: '#2b2b2b',
  pink: '#e58fae',
  blossom: '#e58fae',
  lime: '#c0d860',
}

function findColors(text: string): string[] {
  const hits: string[] = []
  for (const [word, hex] of Object.entries(COLOR_WORDS)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) hits.push(hex)
  }
  return hits
}

function insideCells(layer: DesignLayer): number[] {
  const mask = buildMask(layer.garment, layer.variant)
  const out: number[] = []
  for (let i = 0; i < mask.length; i++) if (mask[i]) out.push(i)
  return out
}

function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Fill every inside cell with a color (base recolor + clear paint cells). */
function recolor(layer: DesignLayer, hex: string): Partial<DesignLayer> {
  return { baseColor: hex, cells: [] }
}

/** Sprinkle random dots across the garment. */
function dots(layer: DesignLayer, colors: string[], density = 0.18): PaintCell[] {
  const inside = insideCells(layer)
  const rand = rng(inside.length + colors.length * 7)
  const cells: PaintCell[] = []
  for (const i of inside) {
    if (rand() < density) {
      cells.push({ i, color: colors[Math.floor(rand() * colors.length)] })
    }
  }
  return cells
}

/** Horizontal stripes. */
function stripes(layer: DesignLayer, colors: string[]): PaintCell[] {
  const { cols, rows } = GRID[layer.garment]
  const inside = new Set(insideCells(layer))
  const cells: PaintCell[] = []
  const band = Math.max(1, Math.floor(rows / 9))
  for (let r = 0; r < rows; r++) {
    if (Math.floor(r / band) % 2 !== 0) continue
    const color = colors[Math.floor(r / band) % colors.length]
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      if (inside.has(i)) cells.push({ i, color })
    }
  }
  return cells
}

/** A centered heart motif. */
function heart(layer: DesignLayer, hex: string): PaintCell[] {
  const { cols, rows } = GRID[layer.garment]
  const inside = new Set(insideCells(layer))
  const cells: PaintCell[] = []
  const cx = 0.5
  const cy = 0.52
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c / (cols - 1) - cx) * 2.4
      const y = -(r / (rows - 1) - cy) * 2.4
      const v = Math.pow(x * x + y * y - 0.3, 3) - x * x * y * y * y
      const i = r * cols + c
      if (v <= 0 && inside.has(i)) cells.push({ i, color: hex })
    }
  }
  return cells
}

export function runWizard(prompt: string, layer: DesignLayer): WizardResult {
  const text = prompt.toLowerCase().trim()
  const colors = findColors(text)
  const palette = colors.length ? colors : PALETTE.slice(0, 4)

  // pattern intents
  if (/\bstrip|stripe|striped\b/.test(text)) {
    return {
      reply: `Done! I laid down some cozy stripes${
        colors.length ? ' in your colors' : ''
      }. Want me to add a motif on top?`,
      patch: { cells: stripes(layer, palette) },
      suggestions: ['Add a heart', 'Make it polka dots', 'Try a different palette'],
    }
  }
  if (/\bpolka|dot|dots|spots|speckle\b/.test(text)) {
    return {
      reply: 'Sprinkled some playful dots across it. Cute, right?',
      patch: { cells: dots(layer, palette) },
      suggestions: ['More dots', 'Fewer dots', 'Switch to stripes'],
    }
  }
  if (/\bheart|love|valentine\b/.test(text)) {
    return {
      reply: 'Aww, added a big heart right in the middle.',
      patch: { cells: heart(layer, palette[0]) },
      suggestions: ['Make the heart pink', 'Add stripes behind it'],
    }
  }
  if (/\bclear|reset|blank|erase all|start over\b/.test(text)) {
    return {
      reply: 'Cleared the canvas so you have a fresh start.',
      patch: { cells: [] },
      suggestions: ['Add stripes', 'Add polka dots', 'Pick a base color'],
    }
  }
  if (colors.length && /\b(base|whole|all|solid|recolor|color it)\b/.test(text)) {
    return {
      reply: `Recolored the whole garment. Looks clean!`,
      patch: recolor(layer, colors[0]),
      suggestions: ['Add a pattern', 'Add a heart'],
    }
  }

  // "fill in the gaps" / surprise me
  if (/\bfill|gaps|surprise|finish|complete|auto|magic|idea\b/.test(text)) {
    const result =
      Math.random() < 0.5
        ? dots(layer, palette, 0.22)
        : stripes(layer, palette)
    return {
      reply:
        'I filled in the gaps with a design I think fits! Tweak it or ask for something else.',
      patch: { cells: result, baseColor: palette[palette.length - 1] },
      suggestions: ['Make it bolder', 'Calmer colors', 'Add a heart'],
    }
  }

  if (colors.length) {
    return {
      reply: `Nice palette! I set the base color for you — tell me a pattern (stripes, dots, heart) and I'll paint it.`,
      patch: recolor(layer, colors[0]),
      suggestions: ['Add stripes', 'Add polka dots', 'Surprise me'],
    }
  }

  // fallback
  return {
    reply:
      "I'm your design buddy! Try things like \"make it sky blue with stripes\", \"add polka dots\", \"put a heart on it\", or \"surprise me\".",
    suggestions: ['Surprise me', 'Add stripes', 'Make it teal'],
  }
}

export function welcomeMessage(): WizardMessage {
  return {
    id: 'welcome',
    role: 'wizard',
    text: "Hi! I'm your design buddy. Describe a vibe and I'll paint it onto your garment — colors, stripes, dots, hearts, or I can just surprise you.",
    suggestions: ['Surprise me', 'Make it teal with stripes', 'Add polka dots'],
  }
}
