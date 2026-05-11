'use client'

import { useState } from 'react'

export function StatsSharingToggle({ initialValue }: { initialValue: boolean }) {
  const [enabled, setEnabled] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  const toggle = async () => {
    const next = !enabled
    setSaving(true)
    try {
      const res = await fetch('/api/users/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareStatsWithFriends: next }),
      })
      if (res.ok) setEnabled(next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-on-surface font-medium text-sm">Share stats with friends</div>
        <div className="text-on-surface-variant text-xs mt-0.5">
          Friends can view your session history and P&L
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        aria-checked={enabled}
        role="switch"
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          enabled ? 'bg-chip-green' : 'bg-outline'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
