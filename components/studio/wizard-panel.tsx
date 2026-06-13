'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Sparkles, Send, Loader2 } from 'lucide-react'
import type { DesignLayer, WizardMessage } from '@/lib/types'
import { runWizard, welcomeMessage } from '@/lib/wizard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = {
  layer: DesignLayer
  color: string
  onApply: (patch: Partial<DesignLayer>) => void
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function WizardPanel({ layer, color, onApply }: Props) {
  const [messages, setMessages] = useState<WizardMessage[]>([welcomeMessage()])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, thinking])

  const send = useCallback(
    (raw: string) => {
      const prompt = raw.trim()
      if (!prompt || thinking) return
      setInput('')
      setMessages((m) => [...m, { id: uid(), role: 'user', text: prompt }])
      setThinking(true)
      // simulate model latency
      setTimeout(
        () => {
          const result = runWizard(prompt, layer, color)
          if (result.patch) onApply(result.patch)
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              role: 'wizard',
              text: result.reply,
              suggestions: result.suggestions,
            },
          ])
          setThinking(false)
        },
        650 + Math.random() * 500,
      )
    },
    [layer, color, onApply, thinking],
  )

  return (
    <div className="flex h-full min-h-[460px] flex-col">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="font-heading text-base font-bold leading-none">
            Design buddy
          </p>
          <p className="text-xs text-muted-foreground">
            Describe it — I&apos;ll draw it
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        style={{ maxHeight: 420 }}
      >
        {messages.map((m) => (
          <div key={m.id} className="space-y-2">
            <div
              className={cn(
                'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-foreground',
              )}
            >
              {m.text}
            </div>
            {m.role === 'wizard' && m.suggestions && (
              <div className="flex flex-wrap gap-1.5">
                {m.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex w-fit items-center gap-2 rounded-2xl bg-secondary/60 px-3.5 py-2.5 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            sketching…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. sky blue with stripes"
          className="h-10 rounded-full"
          aria-label="Describe your design"
        />
        <Button
          type="submit"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          disabled={thinking || !input.trim()}
          aria-label="Send"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}
