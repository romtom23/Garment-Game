import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getCart } from '@/app/actions/cart'
import { SiteHeader } from '@/components/site-header'
import { CartClient } from '@/components/cart-client'

export const metadata = {
  title: 'Your cart — Loomly',
}

export default async function CartPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?next=/cart')

  const items = await getCart()

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <SiteHeader />
      <CartClient items={items} />
    </div>
  )
}
