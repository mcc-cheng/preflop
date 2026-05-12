'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageShell, Card } from '@/components/ui'

type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function PickUsernamePage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [availability, setAvailability] = useState<AvailabilityState>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const checkAvailability = useCallback(async (value: string) => {
    if (!value) { setAvailability('idle'); return }
    setAvailability('checking')
    const res = await fetch(`/api/users/me/username?username=${encodeURIComponent(value)}`)
    if (res.ok) {
      const data = await res.json()
      if (data.reason === 'invalid') setAvailability('invalid')
      else setAvailability(data.available ? 'available' : 'taken')
    } else {
      setAvailability('idle')
    }
  }, [])

  useEffect(() => {
    if (!username) { setAvailability('idle'); return }
    const timer = setTimeout(() => checkAvailability(username), 300)
    return () => clearTimeout(timer)
  }, [username, checkAvailability])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (availability !== 'available') return
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/users/me/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })

    if (res.ok) {
      router.push('/rooms')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || 'Something went wrong')
      setSubmitting(false)
    }
  }

  const statusText = () => {
    switch (availability) {
      case 'checking': return <span className="text-on-surface-variant text-sm">Checking…</span>
      case 'available': return <span className="chip-text-green text-sm">Available</span>
      case 'taken': return <span className="chip-text-red text-sm">Already taken</span>
      case 'invalid': return (
        <span className="chip-text-red text-sm">
          3–20 chars, start with a letter, lowercase letters/numbers/underscores only
        </span>
      )
      default: return null
    }
  }

  const canSubmit = availability === 'available' && !submitting

  return (
    <PageShell>
      <div className="max-w-md mx-auto pt-8">
        <h1 className="text-3xl font-bold text-on-surface mb-2">Pick your username</h1>
        <p className="text-on-surface-variant mb-8">
          This is how other players will find and add you. You can change it later in settings.
        </p>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-on-surface-variant mb-1.5">Username</label>
              <div className="flex items-center bg-surface border border-outline rounded-xl px-3 h-11 focus-within:border-chip-green/35 transition-colors duration-150">
                <span className="text-on-surface-variant select-none mr-1">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="yourhandle"
                  autoComplete="off"
                  autoFocus
                  className="bg-transparent text-on-surface flex-1 focus:outline-none"
                />
              </div>
              <div className="mt-1.5 min-h-[20px]">{statusText()}</div>
            </div>

            {error && <p className="chip-text-red text-sm">{error}</p>}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2.5 bg-chip-white text-black font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-150"
            >
              {submitting ? 'Saving…' : 'Confirm username'}
            </button>
          </form>
        </Card>
      </div>
    </PageShell>
  )
}
