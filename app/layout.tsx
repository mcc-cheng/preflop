import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { TopBar } from '@/components/ui/TopBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Preflop - Home Poker Payouts',
  description: 'Simple, transparent poker game management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>
          <TopBar />
          <main className="pt-14">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
