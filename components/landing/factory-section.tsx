import { Factory, Recycle, BadgeDollarSign, Truck } from 'lucide-react'

const POINTS = [
  {
    icon: Factory,
    title: 'Factories already set up',
    body: 'We partner with warehouses that already produce for established clothing brands — the lines, materials, and expertise are ready.',
  },
  {
    icon: BadgeDollarSign,
    title: 'Spare-capacity pricing',
    body: "If they're already running your style of garment, filling unused capacity with your design costs far less than starting from scratch.",
  },
  {
    icon: Recycle,
    title: 'Made to order',
    body: 'Nothing is mass-produced on a guess. Items are made when designs sell, which cuts waste and overstock.',
  },
  {
    icon: Truck,
    title: 'Straight from the source',
    body: 'Skipping the traditional brand markup means the savings land with you and the designer.',
  },
]

export function FactorySection() {
  return (
    <section id="factory" className="py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <h2 className="text-balance font-heading text-3xl font-extrabold sm:text-4xl">
              Real warehouses. Honestly cheaper.
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              Here&apos;s the idea: factories that specialize in a style of
              clothing and already do custom runs for other brands have unused
              capacity. We route your designs to the factory that already makes
              that exact kind of garment — so you get brand-quality clothing
              without brand-sized prices.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {POINTS.map((p) => (
              <div
                key={p.title}
                className="rounded-3xl border-2 border-border bg-card p-5 shadow-sm"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                  <p.icon className="size-5" />
                </span>
                <h3 className="mt-3 font-heading text-lg font-bold">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
