import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getDesign } from '@/app/actions/designs'
import { StudioShell } from '@/components/studio/studio-shell'
import { Button } from '@/components/ui/button'

export default async function EditStudioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect(`/login?next=/studio/${id}`)

  const design = await getDesign(id)

  if (!design) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-secondary/30 px-6 text-center">
        <h1 className="font-heading text-2xl font-bold">Design not found</h1>
        <p className="text-muted-foreground">
          {"This design doesn't exist or isn't yours to edit."}
        </p>
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  return <StudioShell initialDesign={design} />
}
