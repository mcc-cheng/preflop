'use client'

import { useState, useEffect } from 'react'

type ActivityEntry = {
  roomCode: string
  endedAt: string | null
  netCents: number
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function fmtNet(cents: number) {
  const sign = cents >= 0 ? '+' : '-'
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`
}

export function FriendActivityPreview({ userId }: { userId: string }) {
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/users/${userId}/activity`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.activity) setActivity(data.activity.slice(0, 3))
      })
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-1 mt-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-5 bg-chip-white/5 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (activity.length === 0) return null

  return (
    <div className="mt-2 space-y-1">
      {activity.map((entry, i) => {
        const netClass = entry.netCents > 0 ? 'chip-text-green' : entry.netCents < 0 ? 'chip-text-red' : 'text-on-surface-variant'
        return (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-on-surface-variant font-mono">{entry.roomCode}</span>
            <span className="text-on-surface-variant">{fmtDate(entry.endedAt)}</span>
            <span className={`tabular-nums font-medium ${netClass}`}>{fmtNet(entry.netCents)}</span>
          </div>
        )
      })}
    </div>
  )
}
