'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'

// Paths where the nav links and user avatar are hidden (onboarding / auth flows)
const NAV_HIDDEN_PATHS = ['/login', '/register', '/settings/username']

// Global site navigation — always available to authenticated users
const GLOBAL_NAV = [
  { label: 'Dashboard', href: '/rooms' },
  { label: 'Stats',     href: '/stats' },
  { label: 'Friends',   href: '/friends' },
]

function HamburgerIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function TopBar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const params = useParams()
  const code = params?.code as string | undefined
  const [menuOpen, setMenuOpen] = useState(false)

  const name = (session?.user as any)?.name ?? ''
  const initial = name.charAt(0).toUpperCase()

  const hideNav = NAV_HIDDEN_PATHS.some(p => pathname?.startsWith(p))

  // Active-link helper: exact match, never activate '#' placeholders
  const isActive = (href: string) => href !== '#' && pathname === href

  return (
    <>
      <header
        className="sticky top-0 z-40 h-14 border-b border-chip-white/10 flex items-center justify-between px-4 md:px-6"
        style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        {/* Logo */}
        <Link
          href="/rooms"
          className="font-mono font-bold chip-text-white text-lg tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chip-white/40 rounded"
        >
          Preflop
        </Link>

        {/* Desktop nav — global links */}
        {session && !hideNav && (
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {GLOBAL_NAV.map(item => (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  relative px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chip-white/40
                  ${isActive(item.href)
                    ? 'chip-text-white bg-chip-white/8'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-chip-white/5'
                  }
                `}
              >
                {item.label}
                {isActive(item.href) && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-chip-green-text"
                    aria-hidden="true"
                  />
                )}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side: avatar + mobile hamburger */}
        <div className="flex items-center gap-2">
          {session && !hideNav && (
            <Link
              href="/settings"
              aria-label="Account settings"
              className="w-8 h-8 rounded-full bg-surface-raised border border-chip-white/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface text-sm font-semibold select-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chip-white/40"
            >
              {initial || '?'}
            </Link>
          )}

          {session && !hideNav && (
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-chip-white/5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chip-white/40"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && session && !hideNav && (
        <nav
          id="mobile-nav"
          className="md:hidden fixed top-14 left-0 right-0 z-[39] border-b border-chip-white/10 px-4 py-3 space-y-1"
          style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          aria-label="Mobile navigation"
        >
          {GLOBAL_NAV.map(item => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`
                flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chip-white/40
                ${isActive(item.href)
                  ? 'chip-text-white bg-chip-white/8'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-chip-white/5'
                }
              `}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  )
}
