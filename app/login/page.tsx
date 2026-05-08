'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PAYMENT_TYPES = [
  { value: 'VENMO', label: 'Venmo' },
  { value: 'CASH_APP', label: 'Cash App' },
  { value: 'ZELLE', label: 'Zelle' },
  { value: 'APPLE_PAY', label: 'Apple Pay' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
]

function getIdentifierLabel(type: string) {
  if (type === 'VENMO' || type === 'CASH_APP') return 'Username (e.g., @johndoe)'
  if (type === 'APPLE_PAY' || type === 'PAYPAL' || type === 'ZELLE') return 'Email or phone number'
  return 'Account info'
}

const REQUIRED_METHODS = 2

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRegister = searchParams.get('register') === 'true'
  const redirectTo = searchParams.get('redirect') || '/rooms'

  const [isRegistering, setIsRegistering] = useState(isRegister)
  const [registrationStep, setRegistrationStep] = useState(1)

  // Step 1 fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Step 2 state
  const [addedMethods, setAddedMethods] = useState<{ id: string; type: string; label: string; identifier: string; nickname?: string }[]>([])
  const [showPaymentForm, setShowPaymentForm] = useState(true)
  const [paymentType, setPaymentType] = useState('VENMO')
  const [paymentIdentifier, setPaymentIdentifier] = useState('')
  const [paymentNickname, setPaymentNickname] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const handleLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isRegistering) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, username, phone })
      })

      if (res.ok) {
        const result = await signIn('credentials', { email, password, redirect: false })
        if (result?.ok) {
          setRegistrationStep(2)
        } else {
          setError('Account created but sign-in failed. Try logging in.')
        }
      } else {
        const data = await res.json()
        setError(data.error || 'Registration failed')
      }
    } else {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.ok) {
        router.push(redirectTo)
      } else {
        setError('Invalid email or password')
      }
    }

    setLoading(false)
  }

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentError('')
    setPaymentLoading(true)

    const res = await fetch('/api/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: paymentType,
        identifier: paymentIdentifier,
        nickname: paymentNickname || undefined,
        isDefault: addedMethods.length === 0,
      })
    })

    if (res.ok) {
      const method = await res.json()
      const typeLabel = PAYMENT_TYPES.find(t => t.value === paymentType)?.label ?? paymentType
      setAddedMethods(prev => [...prev, {
        id: method.id,
        type: paymentType,
        label: typeLabel,
        identifier: paymentIdentifier,
        nickname: paymentNickname || undefined,
      }])
      setPaymentIdentifier('')
      setPaymentNickname('')
      setShowPaymentForm(addedMethods.length + 1 < REQUIRED_METHODS)
    } else {
      const data = await res.json()
      setPaymentError(data.error || 'Failed to add payment method')
    }

    setPaymentLoading(false)
  }

  // ── Step 2: Payment Setup ──────────────────────────────────────────
  if (isRegistering && registrationStep === 2) {
    const remaining = REQUIRED_METHODS - addedMethods.length
    const canContinue = addedMethods.length >= REQUIRED_METHODS

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="text-4xl font-bold text-white">🃏 Preflop</Link>
          </div>

          <div className="bg-slate-800 rounded-lg p-8 shadow-xl">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">✓</div>
                <span className="text-sm text-slate-400">Account</span>
              </div>
              <div className="flex-1 h-px bg-slate-600" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">2</div>
                <span className="text-sm text-white font-medium">Payments</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">Set Up Payment Methods</h2>
            <p className="text-slate-400 text-sm mb-6">
              Add at least {REQUIRED_METHODS} payment methods so other players can pay you after games.
            </p>

            {/* Added methods list */}
            {addedMethods.length > 0 && (
              <div className="space-y-2 mb-4">
                {addedMethods.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 bg-slate-700 rounded-lg px-4 py-2.5">
                    <span className="text-green-400 text-sm">✓</span>
                    <div>
                      <span className="text-white text-sm font-medium">{m.label}</span>
                      <span className="text-slate-400 text-sm ml-2">{m.nickname || m.identifier}</span>
                    </div>
                    {i === 0 && (
                      <span className="ml-auto text-xs bg-green-700 text-green-100 px-2 py-0.5 rounded">Default</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{addedMethods.length} of {REQUIRED_METHODS} required</span>
                {canContinue && <span className="text-green-400">Ready!</span>}
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (addedMethods.length / REQUIRED_METHODS) * 100)}%` }}
                />
              </div>
            </div>

            {/* Add payment form */}
            {showPaymentForm ? (
              <form onSubmit={handleAddPaymentMethod} className="space-y-4 bg-slate-750 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PAYMENT_TYPES
                      .filter(t => !addedMethods.some(m => m.type === t.value))
                      .map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {getIdentifierLabel(paymentType)}
                  </label>
                  <input
                    type="text"
                    value={paymentIdentifier}
                    onChange={(e) => setPaymentIdentifier(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nickname <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={paymentNickname}
                    onChange={(e) => setPaymentNickname(e.target.value)}
                    placeholder="e.g., My Venmo"
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {paymentError && <div className="text-red-400 text-sm">{paymentError}</div>}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium"
                  >
                    {paymentLoading ? 'Adding...' : 'Add Method'}
                  </button>
                  {addedMethods.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <button
                onClick={() => {
                  setPaymentType(
                    PAYMENT_TYPES.find(t => !addedMethods.some(m => m.type === t.value))?.value ?? 'VENMO'
                  )
                  setPaymentIdentifier('')
                  setPaymentNickname('')
                  setShowPaymentForm(true)
                }}
                className="w-full py-2 border border-dashed border-slate-600 hover:border-slate-400 text-slate-400 hover:text-slate-200 rounded-lg text-sm transition"
              >
                + Add another payment method
              </button>
            )}

            <button
              onClick={() => router.push(redirectTo)}
              disabled={!canContinue}
              className="mt-5 w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold transition"
            >
              {canContinue
                ? 'Enter App →'
                : `Add ${remaining} more to continue`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 1 / Login ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-bold text-white">🃏 Preflop</Link>
        </div>

        <div className="bg-slate-800 rounded-lg p-8 shadow-xl">
          {isRegistering && (
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">1</div>
                <span className="text-sm text-white font-medium">Account</span>
              </div>
              <div className="flex-1 h-px bg-slate-600" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-slate-400 text-xs font-bold">2</div>
                <span className="text-sm text-slate-400">Payments</span>
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold text-white mb-6">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </h2>

          <form onSubmit={handleLoginOrRegister} className="space-y-4">
            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="lowercase, numbers, underscores"
                    minLength={3}
                    maxLength={20}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 555 000 0000"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
              />
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-semibold transition"
            >
              {loading ? 'Loading...' : isRegistering ? 'Next →' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegistering(!isRegistering); setError('') }}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
