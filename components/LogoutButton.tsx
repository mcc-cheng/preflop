'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
    >
      Logout
    </button>
  )
}
