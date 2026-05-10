'use client'

import { useState } from 'react'
import {
  Card,
  SectionHeader,
  Avatar,
  FormField,
  InlineError,
  ListItemCard,
  StatusBadge,
  PaymentMethodForm,
  PAYMENT_TYPES,
} from '@/components/ui'

export default function SettingsClient({ profile }: { profile: any }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.name)
  const [username, setUsername] = useState(profile.username)
  const [phone, setPhone] = useState(profile.phone || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddPayment, setShowAddPayment] = useState(false)

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
        <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>

        <div className="flex items-start gap-6 mb-6">
          <div className="relative">
            <Avatar name={profile.name} size="xl" />
            <button className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full text-xs">
              📷
            </button>
          </div>

          <div className="flex-1">
            {!editing ? (
              <div className="space-y-3">
                <div>
                  <div className="text-slate-400 text-sm">Name</div>
                  <div className="text-white font-semibold">{profile.name}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Username</div>
                  <div className="text-white font-mono">@{profile.username}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Email</div>
                  <div className="text-white">{profile.email}</div>
                </div>
                {profile.phone && (
                  <div>
                    <div className="text-slate-400 text-sm">Phone</div>
                    <div className="text-white">{profile.phone}</div>
                  </div>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <FormField label="Name">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="Username">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="Phone (optional)">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <InlineError message={error} />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setName(profile.name)
                      setUsername(profile.username)
                      setPhone(profile.phone || '')
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Payment Methods */}
      <Card>
        <SectionHeader
          title="Payment Methods"
          action={
            <button
              onClick={() => setShowAddPayment(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              + Add Payment Method
            </button>
          }
        />

        {showAddPayment && (
          <div className="mb-6 p-4 bg-slate-700 rounded-lg">
            <h3 className="text-white font-semibold mb-4">Add Payment Method</h3>
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
            <div className="text-slate-400 text-center py-8">No payment methods added yet</div>
          ) : (
            profile.paymentMethods.map((method: any) => (
              <ListItemCard key={method.id}>
                <div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    {PAYMENT_TYPES.find(t => t.value === method.type)?.label ?? method.type}
                    {method.isDefault && <StatusBadge label="DEFAULT" color="green" />}
                  </div>
                  <div className="text-slate-400 text-sm">
                    {method.nickname || method.identifier}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePayment(method.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
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
  )
}
