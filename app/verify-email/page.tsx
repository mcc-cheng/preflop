'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found.')
      return
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
          setMessage(data.alreadyVerified ? 'Your email is already verified.' : 'Email verified!')
          setTimeout(() => router.push('/login?verified=true&setup=payments'), 2000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      })
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0d0d12' }}>
      <div className="max-w-md w-full text-center">
        <Link href="/" className="text-4xl font-bold text-white block mb-10">🃏 Preflop</Link>

        <div className="bg-surface border border-outline rounded-2xl p-8" style={{ background: '#1a1a24', borderColor: '#2a2a38' }}>
          {status === 'loading' && (
            <>
              <div className="text-4xl mb-4">⏳</div>
              <h2 className="text-xl font-bold text-white mb-2">Verifying your email…</h2>
              <p className="text-slate-400 text-sm">Just a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-white mb-2">{message}</h2>
              <p className="text-slate-400 text-sm">Redirecting you to sign in…</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-xl font-bold text-white mb-2">Verification failed</h2>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <Link
                href="/login"
                className="inline-block px-6 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm"
                style={{ background: '#4ade80', color: '#0d0d12' }}
              >
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
