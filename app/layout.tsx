import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Baloo_2, Nunito } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const baloo = Baloo_2({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
})
const nunito = Nunito({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Loomly — AI-Designed Clothing Studio',
  description:
    'Doodle it, watch it puff into 3D, and wear it. Loomly turns your sketches into real, factory-made clothing with the help of an AI design buddy.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${baloo.variable} ${nunito.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
