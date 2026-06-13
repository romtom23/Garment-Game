import { headers } from 'next/headers'
import { getPublishedDesignBySlug } from '@/app/actions/designs'
import { auth } from '@/lib/auth'
import { ShopClient } from '@/components/shop-client'

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const design = await getPublishedDesignBySlug(slug)
  const session = await auth.api.getSession({ headers: await headers() })
  return (
    <ShopClient design={design} signedIn={Boolean(session?.user)} />
  )
}
