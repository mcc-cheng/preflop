'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { centsToUSD } from '@/lib/utils'
import { PageShell, BackLink, Avatar, EmptyState } from '@/components/ui'

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUser()
  }, [username])

  const fetchUser = async () => {
    const res = await fetch(`/api/users/${username}`)
    if (res.ok) {
      const data = await res.json()
      setUser(data)
    } else {
      setError('User not found')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <PageShell variant="centered">
        <div className="text-on-surface-variant text-sm">Loading…</div>
      </PageShell>
    )
  }

  if (error || !user) {
    return (
      <PageShell variant="centered">
        <div className="text-center">
          <div className="chip-text-red text-lg mb-4">{error}</div>
          <Link href="/friends" className="text-on-surface-variant hover:text-on-surface transition-colors duration-150">
            ← Back to friends
          </Link>
        </div>
      </PageShell>
    )
  }

  const stats = user.stats || {}
  const hourlyRate = stats.hoursPlayed > 0
    ? (stats.totalWinnings / 100 / stats.hoursPlayed).toFixed(2)
    : '0.00'

  return (
    <PageShell>
      <BackLink href="/friends" label="Back to friends" />

      <div className="max-w-2xl mx-auto">
        <div className="bg-surface border border-outline rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-5">
            <Avatar name={user.name} size="xl" />
            <div>
              <h1 className="text-2xl font-bold text-on-surface">{user.name}</h1>
              <div className="text-on-surface-variant">@{user.username}</div>
              <div className="text-on-surface-variant/60 text-sm mt-0.5">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline rounded-2xl p-6">
          <h2 className="text-lg font-bold text-on-surface mb-5">Statistics</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-raised border border-outline rounded-xl p-5">
              <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">Games Played</div>
              <div className="text-2xl font-bold text-on-surface">{stats.gamesPlayed || 0}</div>
            </div>

            <div className="bg-surface-raised border border-outline rounded-xl p-5">
              <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">Hours Played</div>
              <div className="text-2xl font-bold text-on-surface">{(stats.hoursPlayed || 0).toFixed(1)}h</div>
            </div>

            <div className="bg-surface-raised border border-outline rounded-xl p-5">
              <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">Total Winnings</div>
              <div className={`text-2xl font-bold ${stats.totalWinnings >= 0 ? 'chip-text-green' : 'chip-text-red'}`}>
                {stats.totalWinnings >= 0 ? '+' : ''}${centsToUSD(stats.totalWinnings || 0)}
              </div>
            </div>

            <div className="bg-surface-raised border border-outline rounded-xl p-5">
              <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">Hourly Rate</div>
              <div className={`text-2xl font-bold ${parseFloat(hourlyRate) >= 0 ? 'chip-text-green' : 'chip-text-red'}`}>
                ${hourlyRate}/hr
              </div>
            </div>
          </div>

          {stats.gamesPlayed === 0 && (
            <EmptyState message="No games played yet" />
          )}
        </div>
      </div>
    </PageShell>
  )
}
