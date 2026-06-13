import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createDesign } from '@/app/actions/designs'

export default async function StudioPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?next=/studio')

  // Create a fresh design server-side, then send the user into the editor.
  const design = await createDesign()
  redirect(`/studio/${design.id}`)
}
