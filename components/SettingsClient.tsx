'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Card,
  SectionHeader,
  Avatar,
  FormField,
  InlineError,
  ListItemCard,
  StatusBadge,
  PaymentMethodForm,
  PrimaryButton,
  SecondaryButton,
  PAYMENT_TYPES,
} from '@/components/ui'

export default function SettingsClient({ profile, initialTab }: { profile: any; initialTab?: string }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.name)
  const [username, setUsername] = useState(profile.username)
  const [phone, setPhone] = useState(profile.phone || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddPayment, setShowAddPayment] = useState(false)

  const paymentSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialTab === 'payments') {
      paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [initialTab])

  const [paymentType, setPaymentType] = useState('VENMO')
  const [paymentIdentifier, setPaymentIdentifier] = useState('')
  const [paymentNickname, setPaymentNickname] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const handleSaveProfile = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, phone }),
    })

    if (res.ok) {
      setEditing(false)
      window.location.reload()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to update profile')
    }
    setLoading(false)
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentLoading(true)
    setPaymentError('')

    const res = await fetch('/api/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: paymentType,
        identifier: paymentIdentifier,
        nickname: paymentNickname || undefined,
      }),
    })

    if (res.ok) {
      setShowAddPayment(false)
      setPaymentIdentifier('')
      setPaymentNickname('')
      window.location.reload()
    } else {
      const data = await res.json()
      setPaymentError(data.error || 'Failed to add payment method')
    }
    setPaymentLoading(false)
  }

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Delete this payment method?')) return
    await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' })
    window.location.reload()
  }

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/payment-methods/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    })
    window.location.reload()
  }

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <Card>
        <h2 className="text-xl font-bold text-on-surface mb-6">Profile Information</h2>

        <div className="flex items-start gap-6 mb-6">
          <Avatar name={profile.name} size="xl" />

          <div className="flex-1">
            {!editing ? (
              <div className="space-y-3">
                <div>
                  <div className="text-on-surface-variant text-xs uppercase tracking-wider font-medium">Name</div>
                  <div className="text-on-surface font-semibold mt-0.5">{profile.name}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-xs uppercase tracking-wider font-medium">Username</div>
                  <div className="text-on-surface font-mono mt-0.5">@{profile.username}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-xs uppercase tracking-wider font-medium">Email</div>
                  <div className="text-on-surface mt-0.5">{profile.email}</div>
                </div>
                {profile.phone && (
                  <div>
                    <div className="text-on-surface-variant text-xs uppercase tracking-wider font-medium">Phone</div>
                    <div className="text-on-surface mt-0.5">{profile.phone}</div>
                  </div>
                )}
                <SecondaryButton onClick={() => setEditing(true)} className="mt-2">
                  Edit Profile
                </SecondaryButton>
              </div>
            ) : (
              <div className="space-y-4">
                <FormField label="Name">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                  />
                </FormField>
                <FormField label="Username">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field"
                  />
                </FormField>
                <FormField label="Phone (optional)">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                  />
                </FormField>
                <InlineError message={error} />
                <div className="flex gap-3">
                  <PrimaryButton onClick={handleSaveProfile} loading={loading} loadingText="Saving..." fullWidth={false} className="px-5">
                    Save Changes
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={() => {
                      setEditing(false)
                      setName(profile.name)
                      setUsername(profile.username)
                      setPhone(profile.phone || '')
                    }}
                  >
                    Cancel
                  </SecondaryButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Payment Methods */}
      <div ref={paymentSectionRef}>
      <Card>
        <SectionHeader
          title="Payment Methods"
          action={
            <SecondaryButton onClick={() => setShowAddPayment(true)}>
              + Add
            </SecondaryButton>
          }
        />

        {showAddPayment && (
          <div className="mb-6 p-4 bg-surface-raised border border-outline rounded-xl">
            <h3 className="text-on-surface font-semibold mb-4">Add Payment Method</h3>
            <PaymentMethodForm
              paymentType={paymentType}
              identifier={paymentIdentifier}
              nickname={paymentNickname}
              onChangeType={setPaymentType}
              onChangeIdentifier={setPaymentIdentifier}
              onChangeNickname={setPaymentNickname}
              onSubmit={handleAddPayment}
              onCancel={() => setShowAddPayment(false)}
              loading={paymentLoading}
              error={paymentError}
            />
          </div>
        )}

        <div className="space-y-3">
          {profile.paymentMethods.length === 0 ? (
            <div className="text-on-surface-variant text-center py-8 text-sm">No payment methods added yet</div>
          ) : (
            profile.paymentMethods.map((method: any) => (
              <ListItemCard key={method.id}>
                <div>
                  <div className="text-on-surface font-semibold flex items-center gap-2">
                    {PAYMENT_TYPES.find(t => t.value === method.type)?.label ?? method.type}
                    {method.isDefault && <StatusBadge label="DEFAULT" color="green" />}
                  </div>
                  <div className="text-on-surface-variant text-sm">
                    {method.nickname || method.identifier}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-outline text-on-surface-variant hover:text-on-surface hover:border-chip-white/25 transition-colors duration-150"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePayment(method.id)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-chip-red/35 chip-text-red hover:bg-chip-red-dim transition-colors duration-150"
                  >
                    Delete
                  </button>
                </div>
              </ListItemCard>
            ))
          )}
        </div>
      </Card>
      </div>
    </div>
  )
}
