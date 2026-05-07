'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewRoomPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [defaultBuyIn, setDefaultBuyIn] = useState('100')
  const [blinds, setBlinds] = useState('1/2')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        defaultBuyIn: parseFloat(defaultBuyIn),
        blinds: blinds || undefined,
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : undefined,
        currency: 'USD'
      })
    })

    if (res.ok) {
      const room = await res.json()
      router.push(`/rooms/${room.code}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create room')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/rooms" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to rooms
          </Link>

          <div className="bg-slate-800 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Create New Room</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Friday Night Poker"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Default Buy-in (USD) *
                </label>
                <input
                  type="number"
                  value={defaultBuyIn}
                  onChange={(e) => setDefaultBuyIn(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Blinds (optional)
                </label>
                <input
                  type="text"
                  value={blinds}
                  onChange={(e) => setBlinds(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1/2 or 0.5/1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Players (optional)
                </label>
                <input
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="9"
                  min="2"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-semibold transition"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
