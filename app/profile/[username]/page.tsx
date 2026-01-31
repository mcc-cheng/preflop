'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { centsToUSD } from '@/lib/utils'

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <Link href="/friends" className="text-blue-400 hover:text-blue-300">
            ← Back to friends
          </Link>
        </div>
      </div>
    )
  }

  const stats = user.stats || {}
  const hourlyRate = stats.hoursPlayed > 0 
    ? (stats.totalWinnings / 100 / stats.hoursPlayed).toFixed(2)
    : '0.00'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/friends" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to friends
        </Link>

        <div className="max-w-2xl mx-auto">
          {/* Profile Header */}
          <div className="bg-slate-800 rounded-lg p-8 mb-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-white text-4xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
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
                <div className={`text-3xl font-bold ${
                  stats.totalWinnings >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats.totalWinnings >= 0 ? '+' : ''}${centsToUSD(stats.totalWinnings || 0)}
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-6">
                <div className="text-slate-400 text-sm mb-2">Hourly Rate</div>
                <div className={`text-3xl font-bold ${
                  parseFloat(hourlyRate) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${hourlyRate}/hr
                </div>
              </div>
            </div>

            {stats.gamesPlayed === 0 && (
              <div className="mt-6 text-center text-slate-400 py-8">
                No games played yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
