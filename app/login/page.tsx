'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  PageShell,
  Card,
  FormField,
  PrimaryButton,
  InlineError,
  StepIndicator,
  ProgressBar,
  PaymentMethodForm,
  PAYMENT_TYPES,
} from '@/components/ui'

const REQUIRED_METHODS = 2

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRegister = searchParams.get('register') === 'true'
  const redirectTo = searchParams.get('redirect') || '/rooms'

  const [isRegistering, setIsRegistering] = useState(isRegister)
  const [registrationStep, setRegistrationStep] = useState(1)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
        body: JSON.stringify({ email, password, name, username, phone }),
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
      }),
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
      <PageShell variant="centered">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="text-4xl font-bold text-white">🃏 Preflop</Link>
          </div>

          <Card padding="lg" className="shadow-xl">
            <StepIndicator steps={['Account', 'Payments']} currentStep={2} />

            <h2 className="text-2xl font-bold text-white mb-1 mt-6">Set Up Payment Methods</h2>
            <p className="text-slate-400 text-sm mb-6">
              Add at least {REQUIRED_METHODS} payment methods so other players can pay you after games.
            </p>

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

            <ProgressBar
              value={addedMethods.length}
              max={REQUIRED_METHODS}
              label={`${addedMethods.length} of ${REQUIRED_METHODS} required`}
              readyLabel="Ready!"
            />

            <div className="mt-5">
              {showPaymentForm ? (
                <PaymentMethodForm
                  paymentType={paymentType}
                  identifier={paymentIdentifier}
                  nickname={paymentNickname}
                  onChangeType={setPaymentType}
                  onChangeIdentifier={setPaymentIdentifier}
                  onChangeNickname={setPaymentNickname}
                  onSubmit={handleAddPaymentMethod}
                  onCancel={addedMethods.length > 0 ? () => setShowPaymentForm(false) : undefined}
                  loading={paymentLoading}
                  error={paymentError}
                  submitLabel="Add Method"
                  excludeTypes={addedMethods.map(m => m.type)}
                />
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
            </div>

            <button
              onClick={() => router.push(redirectTo)}
              disabled={!canContinue}
              className="mt-5 w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold transition"
            >
              {canContinue ? 'Enter App →' : `Add ${remaining} more to continue`}
            </button>
          </Card>
        </div>
      </PageShell>
    )
  }

  // ── Step 1 / Login ─────────────────────────────────────────────────
  return (
    <PageShell variant="centered">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-bold text-white">🃏 Preflop</Link>
        </div>

        <Card padding="lg" className="shadow-xl">
          {isRegistering && (
            <div className="mb-6">
              <StepIndicator steps={['Account', 'Payments']} currentStep={1} />
            </div>
          )}

          <h2 className="text-2xl font-bold text-white mb-6">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </h2>

          <form onSubmit={handleLoginOrRegister} className="space-y-4">
            {isRegistering && (
              <>
                <FormField label="Name">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </FormField>

                <FormField label="Username">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="starts with a letter, a–z, 0–9, _"
                    pattern="^[a-z][a-z0-9_]{2,19}$"
                    minLength={3}
                    maxLength={20}
                    required
                  />
                </FormField>

                <FormField label="Phone">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 555 123 4567"
                    required
                  />
                </FormField>
              </>
            )}

            <FormField label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </FormField>

            <FormField label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
              />
            </FormField>

            <InlineError message={error} />

            <PrimaryButton type="submit" loading={loading} loadingText="Loading...">
              {isRegistering ? 'Next →' : 'Sign In'}
            </PrimaryButton>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegistering(!isRegistering); setError('') }}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </Card>
      </div>
    </PageShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
