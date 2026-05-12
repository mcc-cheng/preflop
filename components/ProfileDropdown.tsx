'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

const ITEM_COUNT = 3

const baseItemClass =
  'flex items-center gap-3 w-full px-4 py-3 text-sm text-on-surface-variant hover:text-on-surface hover:bg-chip-white/5 transition-colors duration-150 focus-visible:outline-none focus-visible:bg-chip-white/8 focus-visible:text-on-surface text-left'

export function ProfileDropdown() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>(Array(ITEM_COUNT).fill(null))

  const name = (session?.user as any)?.name ?? ''
  const initial = name.charAt(0).toUpperCase()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Close on Escape, return focus to trigger
  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  // Focus first item when menu opens
  useEffect(() => {
    if (open) itemRefs.current[0]?.focus()
  }, [open])

  const handleItemKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault()
      itemRefs.current[(idx + 1) % ITEM_COUNT]?.focus()
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault()
      itemRefs.current[(idx - 1 + ITEM_COUNT) % ITEM_COUNT]?.focus()
    }
  }

  if (!session) return null

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen(prev => !prev)}
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="w-8 h-8 rounded-full bg-surface-raised border border-chip-white/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface text-sm font-semibold select-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chip-white/40"
      >
        {initial || '?'}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 top-full mt-2 w-52 bg-surface-raised border border-outline rounded-2xl shadow-xl overflow-hidden animate-dropdown-in"
          style={{ zIndex: 50 }}
        >
          <Link
            href="/settings"
            role="menuitem"
            ref={(el) => { itemRefs.current[0] = el }}
            onClick={() => setOpen(false)}
            onKeyDown={(e) => handleItemKeyDown(e, 0)}
            className={baseItemClass}
            tabIndex={0}
          >
            <UserIcon />
            Profile Settings
          </Link>
          <div className="h-px bg-outline" />
          <Link
            href="/settings?tab=payments"
            role="menuitem"
            ref={(el) => { itemRefs.current[1] = el }}
            onClick={() => setOpen(false)}
            onKeyDown={(e) => handleItemKeyDown(e, 1)}
            className={baseItemClass}
            tabIndex={0}
          >
            <CreditCardIcon />
            Payment Methods
          </Link>
          <div className="h-px bg-outline" />
          <button
            role="menuitem"
            ref={(el) => { itemRefs.current[2] = el }}
            onClick={() => signOut({ callbackUrl: '/' })}
            onKeyDown={(e) => handleItemKeyDown(e, 2)}
            className={`${baseItemClass} hover:text-chip-red-text hover:bg-chip-red-dim`}
            tabIndex={0}
          >
            <LogoutIcon />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
