'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false })

function JoinRoomContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()

  const [code, setCode] = useState(() => (searchParams.get('code') ?? '').toUpperCase())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)

  const submitCode = async (roomCode: string) => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: roomCode.toUpperCase() }),
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

  // Auto-join when a code arrives via QR link and the user is already logged in
  useEffect(() => {
    const paramCode = searchParams.get('code')
    if (!paramCode || status === 'loading') return

    if (status === 'unauthenticated') {
      // Send them to login, then back here after
      const redirect = `/rooms/join?code=${paramCode.toUpperCase()}`
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`)
      return
    }

    if (status === 'authenticated') {
      submitCode(paramCode.toUpperCase())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitCode(code)
  }

  const handleScan = (scannedCode: string) => {
    setScanning(false)
    setCode(scannedCode)
    submitCode(scannedCode)
  }

  // While auto-joining from QR link, show a minimal loading state
  if (searchParams.get('code') && (status === 'loading' || (status === 'authenticated' && loading))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Joining room…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {scanning && (
        <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Link href="/rooms" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to rooms
          </Link>

          <div className="bg-slate-800 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Join Room</h1>

            <button
              onClick={() => setScanning(true)}
              className="w-full flex items-center justify-center gap-2 py-3 mb-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition border border-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                <rect x="7" y="7" width="4" height="4" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="13" y="7" width="4" height="4" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="7" y="13" width="4" height="4" rx="0.5" strokeLinecap="round" strokeLinejoin="round" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h4v-4" />
              </svg>
              Scan QR Code
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-slate-600" />
              <span className="text-slate-400 text-sm">or enter code</span>
              <div className="flex-1 h-px bg-slate-600" />
            </div>

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
                disabled={loading || code.length !== 6}
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

export default function JoinRoomPage() {
  return (
    <Suspense fallback={null}>
      <JoinRoomContent />
    </Suspense>
  )
}
