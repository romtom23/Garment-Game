'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shirt, LogOut, ShoppingBag } from 'lucide-react'
import { useAuth } from '@/lib/use-auth'
import { Button } from '@/components/ui/button'

export function SiteHeader() {
  const { user, ready, logout } = useAuth()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Shirt className="size-5" />
          </span>
          <span className="font-heading text-xl font-extrabold tracking-tight">
            Loomly
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/#how"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            href="/#factory"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Our factories
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {ready && user ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="font-semibold"
                aria-label="Cart"
              >
                <Link href="/cart">
                  <ShoppingBag className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="font-semibold">
                <Link href="/dashboard">My studio</Link>
              </Button>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Log out"
                onClick={() => {
                  logout()
                  router.push('/')
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="font-semibold">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="font-semibold">
                <Link href="/signup">Start designing</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
