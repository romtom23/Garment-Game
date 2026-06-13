import type { Decoration, DesignLayer, WizardMessage } from './types'
import { PALETTE } from './garments'
import { makeDecoration, uid } from './decorations'

// Mock "AI design wizard". It interprets a natural-language prompt and returns
// a friendly reply plus an optional patch to the active garment layer. Now it
// emits smooth vector decorations (the refined model) rather than pixel cells.
// Isolated so it can later be swapped for a real model without UI changes.

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

function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Horizontal stripes as full-width rectangles. */
function stripes(colors: string[]): Decoration[] {
  const out: Decoration[] = []
  const bands = 5
  for (let i = 0; i < bands; i++) {
    if (i % 2 === 1) continue
    const cy = (i + 0.5) / bands
    out.push({
      id: uid(),
      kind: 'rect',
      x: 0.5,
      y: cy,
      w: 1.1,
      h: 1 / bands,
      rotation: 0,
      fill: colors[(i / 2) % colors.length] ?? colors[0],
      stroke: 'transparent',
      strokeWidth: 0,
    })
  }
  return out
}

/** Scattered dots as small circles. */
function dots(colors: string[], count = 14): Decoration[] {
  const rand = rng(count + colors.length * 7)
  const out: Decoration[] = []
  for (let i = 0; i < count; i++) {
    const size = 0.06 + rand() * 0.06
    const dec = makeDecoration(
      'circle',
      0.1 + rand() * 0.8,
      0.1 + rand() * 0.8,
      colors[Math.floor(rand() * colors.length)],
      'transparent',
    )
    dec.w = size
    dec.h = size
    dec.strokeWidth = 0
    out.push(dec)
  }
  return out
}

/** A centered star motif. */
function starMotif(hex: string): Decoration[] {
  const dec = makeDecoration('star', 0.5, 0.5, hex, '#2b2b2b')
  dec.w = 0.42
  dec.h = 0.42
  return [dec]
}

export function runWizard(
  prompt: string,
  layer: DesignLayer,
  drawColor: string,
): WizardResult {
  const text = prompt.toLowerCase().trim()
  const colors = findColors(text)
  const palette = colors.length ? colors : [drawColor, ...PALETTE.slice(0, 3)]

  if (/\bstrip|stripe|striped\b/.test(text)) {
    return {
      reply: `Done! I laid down some clean stripes${
        colors.length ? ' in your colors' : ''
      }. Want a motif on top?`,
      patch: { decorations: [...layer.decorations, ...stripes(palette)] },
      suggestions: ['Add a star', 'Make it polka dots', 'Different palette'],
    }
  }
  if (/\bpolka|dot|dots|spots|speckle\b/.test(text)) {
    return {
      reply: 'Sprinkled some playful dots across it.',
      patch: { decorations: [...layer.decorations, ...dots(palette)] },
      suggestions: ['More dots', 'Add stripes', 'Add a star'],
    }
  }
  if (/\bstar|sparkle\b/.test(text)) {
    return {
      reply: 'Popped a big star right in the middle.',
      patch: {
        decorations: [...layer.decorations, ...starMotif(palette[0])],
      },
      suggestions: ['Make it gold', 'Add stripes behind it'],
    }
  }
  if (/\bclear|reset|blank|erase all|start over\b/.test(text)) {
    return {
      reply: 'Cleared the canvas for a fresh start.',
      patch: { decorations: [] },
      suggestions: ['Add stripes', 'Add polka dots', 'Pick a fabric color'],
    }
  }
  if (
    colors.length &&
    /\b(base|whole|all|solid|recolor|color it|fabric)\b/.test(text)
  ) {
    return {
      reply: 'Recolored the fabric. Looks clean!',
      patch: { baseColor: colors[0] },
      suggestions: ['Add a pattern', 'Add a star'],
    }
  }
  if (/\bfill|gaps|surprise|finish|complete|auto|magic|idea\b/.test(text)) {
    const deco =
      Math.random() < 0.5 ? dots(palette, 18) : stripes(palette)
    return {
      reply: 'I filled it in with a design I think fits! Tweak away.',
      patch: {
        baseColor: palette[palette.length - 1],
        decorations: [...layer.decorations, ...deco],
      },
      suggestions: ['Make it bolder', 'Calmer colors', 'Add a star'],
    }
  }
  if (colors.length) {
    return {
      reply:
        'Nice palette! I set the fabric color — tell me a pattern (stripes, dots, star) and I\u2019ll add it.',
      patch: { baseColor: colors[0] },
      suggestions: ['Add stripes', 'Add polka dots', 'Surprise me'],
    }
  }

  return {
    reply:
      'I\u2019m your design buddy! Try "make it sky blue with stripes", "add polka dots", "put a star on it", or "surprise me".',
    suggestions: ['Surprise me', 'Add stripes', 'Make it teal'],
  }
}

export function welcomeMessage(): WizardMessage {
  return {
    id: 'welcome',
    role: 'wizard',
    text: "Hi! I'm your design buddy. Describe a vibe and I'll add smooth shapes to your garment — colors, stripes, dots, stars, or I can surprise you.",
    suggestions: ['Surprise me', 'Make it teal with stripes', 'Add polka dots'],
  }
}
