import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatUSD } from '@/lib/pricing'

const ITEMS = [
  {
    name: 'Mascot Head',
    factory: 28,
    price: 40.6,
    retail: 77,
    blurb: 'Plush-style character heads with custom faces and ears.',
  },
  {
    name: 'Custom Shirt',
    factory: 14,
    price: 20.3,
    retail: 39,
    featured: true,
    blurb: 'Crewneck, hoodie, or tank — painted however you like.',
  },
  {
    name: 'Sweatpants',
    factory: 19,
    price: 27.55,
    retail: 52,
    blurb: 'Joggers, flares, or shorts with your own pattern.',
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="bg-card/40 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-balance font-heading text-3xl font-extrabold sm:text-4xl">
            Pricing that bakes in your design
          </h2>
          <p className="mt-3 text-pretty text-lg text-muted-foreground">
            You see the factory cost, a small design fee, and our slim margin —
            no mystery brand markup.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {ITEMS.map((item) => (
            <div
              key={item.name}
              className={
                'flex flex-col rounded-3xl border-2 bg-card p-6 shadow-sm ' +
                (item.featured
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border')
              }
            >
              {item.featured && (
                <span className="mb-3 w-fit rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="font-heading text-xl font-bold">{item.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.blurb}
              </p>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-heading text-4xl font-extrabold">
                  {formatUSD(item.price)}
                </span>
                <span className="mb-1 text-sm font-semibold text-muted-foreground line-through">
                  {formatUSD(item.retail)}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-primary">
                Factory cost {formatUSD(item.factory)} + design + slim margin
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {[
                  'Made to order, no minimums',
                  'Your design baked into the price',
                  'Shareable shop link',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="font-bold shadow-md">
            <Link href="/signup">Design yours now</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
