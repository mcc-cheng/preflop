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
        <div className="text-white text-xl">Loading...</div>
      </PageShell>
    )
  }

  if (error || !user) {
    return (
      <PageShell variant="centered">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <Link href="/friends" className="text-blue-400 hover:text-blue-300">
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
        {/* Profile Header */}
        <div className="bg-slate-800 rounded-lg p-8 mb-6">
          <div className="flex items-center gap-6">
            <Avatar name={user.name} size="xl" />
            <div>
              <h1 className="text-3xl font-bold text-white">{user.name}</h1>
              <div className="text-slate-400 text-lg">@{user.username}</div>
              <div className="text-slate-500 text-sm mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-slate-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Statistics</h2>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-700 rounded-lg p-6">
              <div className="text-slate-400 text-sm mb-2">Games Played</div>
              <div className="text-3xl font-bold text-white">{stats.gamesPlayed || 0}</div>
            </div>

            <div className="bg-slate-700 rounded-lg p-6">
              <div className="text-slate-400 text-sm mb-2">Hours Played</div>
              <div className="text-3xl font-bold text-white">{(stats.hoursPlayed || 0).toFixed(1)}h</div>
            </div>

            <div className="bg-slate-700 rounded-lg p-6">
              <div className="text-slate-400 text-sm mb-2">Total Winnings</div>
              <div className={`text-3xl font-bold ${stats.totalWinnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.totalWinnings >= 0 ? '+' : ''}${centsToUSD(stats.totalWinnings || 0)}
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-6">
              <div className="text-slate-400 text-sm mb-2">Hourly Rate</div>
              <div className={`text-3xl font-bold ${parseFloat(hourlyRate) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
