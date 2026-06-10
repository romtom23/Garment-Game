import Image from 'next/image'

const STEPS = [
  {
    img: '/step-draw.png',
    title: 'Doodle over a template',
    body: 'Pick a mascot head, shirt, or sweatpants style and paint on a friendly grid — no design skills required.',
  },
  {
    img: '/step-inflate.png',
    title: 'Watch it bubble into 3D',
    body: 'Hit "bring it to life" and your flat drawing puffs out into a soft, rotatable 3D garment you can spin around.',
  },
  {
    img: '/step-ship.png',
    title: 'Publish a shop & ship it',
    body: 'Partner factories make it for real. Share a shop link and the design cost is baked into a fair price.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="bg-card/40 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-balance font-heading text-3xl font-extrabold sm:text-4xl">
            From doodle to doorstep in three steps
          </h2>
          <p className="mt-3 text-pretty text-lg text-muted-foreground">
            The whole thing feels like playing, not working.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col rounded-3xl border-2 border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-secondary/30">
                <Image
                  src={step.img}
                  alt=""
                  width={400}
                  height={300}
                  className="h-44 w-full object-cover"
                />
              </div>
              <span className="mb-2 inline-flex size-8 items-center justify-center rounded-full bg-primary font-heading text-sm font-extrabold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="font-heading text-xl font-bold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
