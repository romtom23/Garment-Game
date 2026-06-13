import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getAllOrders } from '@/app/actions/orders'
import { SiteHeader } from '@/components/site-header'
import { OrdersClient } from '@/components/orders-client'

export const metadata = {
  title: 'Order tracker — Loomly',
}

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?next=/orders')

  const orders = await getAllOrders()

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <SiteHeader />
      <OrdersClient orders={orders} />
    </div>
  )
}
