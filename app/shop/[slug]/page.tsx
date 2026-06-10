import { use } from 'react'
import { ShopClient } from '@/components/shop-client'

export default function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  return <ShopClient slug={slug} />
}
