import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import './globals.css'
import { Providers } from './providers'
import { TopBar } from '@/components/ui/TopBar'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Preflop - Home Poker Payouts',
  description: 'Simple, transparent poker game management',
}

const USERNAME_PICK_EXCLUDED = ['/settings/username', '/login', '/register', '/api/']

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  const isExcluded = USERNAME_PICK_EXCLUDED.some(p => pathname.startsWith(p))

  if (!isExcluded) {
    const sessionUser = await getCurrentUser()
    if (sessionUser) {
      const dbUser = await prisma.user.findUnique({
        where: { id: (sessionUser as any).id },
        select: { usernameSetByUser: true },
      })
      if (dbUser && !dbUser.usernameSetByUser) {
        redirect('/settings/username')
      }
    }
  }

  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>
          <TopBar />
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
