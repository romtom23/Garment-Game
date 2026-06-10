import Link from 'next/link'
import { Shirt } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Shirt className="size-4" />
          </span>
          <span className="font-heading text-lg font-extrabold">Loomly</span>
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          Doodle it, puff it, wear it. Made with care in partner warehouses.
        </p>
        <p className="text-xs text-muted-foreground">
          {`© ${new Date().getFullYear()} Loomly`}
        </p>
      </div>
    </footer>
  )
}
