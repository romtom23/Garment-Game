import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-bold text-foreground">
            <Sparkles className="size-4 text-primary" />
            Draw it. Watch it puff into 3D.
          </span>
          <h1 className="text-balance font-heading text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Design clothes like you&apos;re doodling in a cozy game.
          </h1>
          <p className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
            Sketch a mascot head, shirt, and sweatpants over simple templates.
            Our design buddy fills in the gaps, your drawing inflates into a
            soft 3D preview, then real factories make it — and you can share a
            shop link to sell it.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="font-bold shadow-md">
              <Link href="/signup">
                Start designing free
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="font-bold"
            >
              <Link href="/#how">See how it works</Link>
            </Button>
          </div>
          <p className="text-sm font-semibold text-muted-foreground">
            No design skills needed. Factory-direct pricing.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[3rem] bg-accent/40 blur-2xl" />
          <div className="overflow-hidden rounded-[2.5rem] border-2 border-border bg-card shadow-xl">
            <Image
              src="/hero-mascot.png"
              alt="A cute mascot character wearing a custom-designed shirt and joggers"
              width={720}
              height={720}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
