import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { FactorySection } from '@/components/landing/factory-section'
import { Pricing } from '@/components/landing/pricing'

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <FactorySection />
        <Pricing />
      </main>
      <SiteFooter />
    </div>
  )
}
