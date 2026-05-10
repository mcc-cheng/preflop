'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'

export function TopBar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const params = useParams()
  const code = params?.code as string | undefined
  const name = (session?.user as any)?.name ?? ''
  const initial = name.charAt(0).toUpperCase()

  const desktopNavItems = code
    ? [
        { label: 'Dashboard',    href: `/rooms/${code}` },
        { label: 'Transactions', href: '#' },
        { label: 'Settlement',   href: '#' },
      ]
    : []

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b border-chip-white/15 flex items-center justify-between px-4 md:px-6">
      <Link href="/rooms" className="font-mono font-bold chip-text-white text-lg tracking-tight">
        Preflop
      </Link>

      {desktopNavItems.length > 0 && (
        <nav className="hidden md:flex items-center gap-6">
          {desktopNavItems.map((item) => {
            const isActive = item.href !== '#' && pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`text-sm transition-colors duration-200 ${
                  isActive
                    ? 'text-chip-white font-medium border-b-2 border-chip-white pb-0.5'
                    : 'text-on-surface-variant hover:text-chip-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      )}

      {session && (
        <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-on-surface-variant text-sm font-medium select-none">
          {initial || '?'}
        </div>
      )}
    </header>
  )
}
