'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ChipEntry {
  color: string
  denomination: string // dollars, as typed by user
}

export default function NewRoomPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [defaultBuyIn, setDefaultBuyIn] = useState('100')
  const [blinds, setBlinds] = useState('1/2')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [chips, setChips] = useState<ChipEntry[]>([{ color: '', denomination: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addChip = () => setChips(prev => [...prev, { color: '', denomination: '' }])
  const removeChip = (i: number) => setChips(prev => prev.filter((_, idx) => idx !== i))
  const updateChip = (i: number, field: keyof ChipEntry, value: string) =>
    setChips(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Convert chip denominations from dollars to cents and validate
    const parsedChips = chips.map(c => ({
      color: c.color.trim(),
      denomination: Math.round(parseFloat(c.denomination) * 100),
    }))

    const invalidChip = parsedChips.find(
      c => !c.color || isNaN(c.denomination) || c.denomination <= 0
    )
    if (invalidChip) {
      setError('Each chip must have a color and a denomination greater than $0.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        defaultBuyIn: parseFloat(defaultBuyIn),
        blinds: blinds || undefined,
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : undefined,
        currency: 'USD',
        chips: parsedChips,
      }),
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none">$</span>
                  <input
                    type="number"
                    value={defaultBuyIn}
                    onChange={(e) => setDefaultBuyIn(e.target.value)}
                    className="w-full pl-7 pr-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
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

              {/* Chip Configuration */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">
                      Chip Configuration *
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Define each chip color and its dollar value
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addChip}
                    className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg font-medium transition"
                  >
                    + Add Chip
                  </button>
                </div>

                <div className="space-y-2">
                  {chips.map((chip, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={chip.color}
                        onChange={(e) => updateChip(i, 'color', e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Color (e.g. White, Red, Blue)"
                        required
                      />
                      <div className="relative w-36">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={chip.denomination}
                          onChange={(e) => updateChip(i, 'denomination', e.target.value)}
                          className="w-full pl-7 pr-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="0.25"
                          step="0.01"
                          min="0.01"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeChip(i)}
                        disabled={chips.length === 1}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        aria-label="Remove chip"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
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
