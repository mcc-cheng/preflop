'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="px-5 py-2 bg-surface-raised border border-outline text-on-surface-variant hover:text-on-surface rounded-xl text-sm font-medium transition-colors duration-150"
    >
      Logout
    </button>
  )
}
