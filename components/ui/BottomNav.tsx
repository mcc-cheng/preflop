'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'

const NAV_ICONS = {
  Dashboard: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  ),
  Transactions: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Settlement: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
}

export function BottomNav() {
  const pathname = usePathname()
  const params = useParams()
  const code = params?.code as string | undefined

  const navItems = [
    { label: 'Dashboard',    href: code ? `/rooms/${code}` : '#' },
    { label: 'Transactions', href: '#' },
    { label: 'Settlement',   href: '#' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-background border-t border-chip-white/15 flex items-center">
      {navItems.map((item) => {
        const isActive = item.href !== '#' && pathname === item.href
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              isActive ? 'text-chip-green-text' : 'text-on-surface-variant'
            }`}
          >
            {NAV_ICONS[item.label as keyof typeof NAV_ICONS]}
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
