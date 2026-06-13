import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { listDesigns } from '@/app/actions/designs'
import { getMyOrders } from '@/app/actions/orders'
import { SiteHeader } from '@/components/site-header'
import { DashboardClient } from '@/components/dashboard-client'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?next=/dashboard')

  const [designs, orders] = await Promise.all([listDesigns(), getMyOrders()])

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <SiteHeader />
      <DashboardClient designs={designs} orders={orders} />
    </div>
  )
}
