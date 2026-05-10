'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageShell, BackLink, Card, FormField, CurrencyInput, PrimaryButton, InlineError, SectionHeader } from '@/components/ui'

interface ChipEntry {
  color: string
  denomination: string
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
    <PageShell>
      <div className="max-w-2xl mx-auto">
        <BackLink href="/rooms" label="Back to rooms" />

        <Card padding="lg">
          <h1 className="text-3xl font-bold text-white mb-6">Create New Room</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Room Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Friday Night Poker"
                required
              />
            </FormField>

            <FormField label="Default Buy-in (USD)" required>
              <CurrencyInput
                value={defaultBuyIn}
                onChange={(e) => setDefaultBuyIn(e.target.value)}
                placeholder="100"
                step="0.01"
                min="0"
                required
              />
            </FormField>

            <FormField label="Blinds (optional)">
              <input
                type="text"
                value={blinds}
                onChange={(e) => setBlinds(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1/2 or 0.5/1"
              />
            </FormField>

            <FormField label="Max Players (optional)">
              <input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="9"
                min="2"
              />
            </FormField>

            {/* Chip Configuration */}
            <div>
              <SectionHeader
                title="Chip Configuration"
                action={
                  <button
                    type="button"
                    onClick={addChip}
                    className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg font-medium transition"
                  >
                    + Add Chip
                  </button>
                }
              />
              <p className="text-xs text-slate-500 -mt-4 mb-3">Define each chip color and its dollar value</p>

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
                    <div className="w-36">
                      <CurrencyInput
                        value={chip.denomination}
                        onChange={(e) => updateChip(i, 'denomination', e.target.value)}
                        placeholder="0.25"
                        step="0.01"
                        min="0.01"
                        required
                        className="text-sm py-2"
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

            <InlineError message={error} />

            <PrimaryButton type="submit" loading={loading} loadingText="Creating...">
              Create Room
            </PrimaryButton>
          </form>
        </Card>
      </div>
    </PageShell>
  )
}
