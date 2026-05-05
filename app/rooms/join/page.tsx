'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinRoomPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [linkedPaymentTypeCount, setLinkedPaymentTypeCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.ok ? res.json() : null)
      .then(profile => {
        const types = new Set((profile?.paymentMethods || []).map((method: any) => method.type))
        setLinkedPaymentTypeCount(types.size)
      })
      .catch(() => setLinkedPaymentTypeCount(0))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((linkedPaymentTypeCount || 0) < 2) {
      setError('Link at least two payment types before joining a room')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase() })
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/rooms/${data.roomCode}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to join room')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Link href="/rooms" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to rooms
          </Link>

          <div className="bg-slate-800 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Join Room</h1>

            {(linkedPaymentTypeCount ?? 0) < 2 && (
              <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-950/40 p-4 text-blue-100">
                <div className="font-semibold">Payment setup required</div>
                <p className="mt-1 text-sm text-blue-100/75">
                  Link two payment types before joining a room. You currently have {linkedPaymentTypeCount ?? 0}.
                </p>
                <Link href="/settings" className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Manage Payment Methods
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-700 text-white text-center text-2xl font-mono rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  placeholder="ABC123"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6 || linkedPaymentTypeCount === null || linkedPaymentTypeCount < 2}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-semibold transition"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
