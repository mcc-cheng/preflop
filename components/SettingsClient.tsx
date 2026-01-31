'use client'

import { useState } from 'react'
import Image from 'next/image'

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  VENMO: 'Venmo',
  APPLE_PAY: 'Apple Pay',
  BANK_TRANSFER: 'Bank Transfer',
  DEBIT_CARD: 'Debit Card',
  PAYPAL: 'PayPal',
  ZELLE: 'Zelle',
  CASH_APP: 'Cash App',
}

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

  const handleSaveProfile = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, phone })
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
    setLoading(true)
    setError('')

    const res = await fetch('/api/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: paymentType,
        identifier: paymentIdentifier,
        nickname: paymentNickname || undefined
      })
    })

    if (res.ok) {
      setShowAddPayment(false)
      setPaymentIdentifier('')
      setPaymentNickname('')
      window.location.reload()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to add payment method')
    }
    setLoading(false)
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
      body: JSON.stringify({ isDefault: true })
    })
    window.location.reload()
  }

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>

        <div className="flex items-start gap-6 mb-6">
          <div className="relative w-24 h-24">
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-white text-3xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
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
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {error && <div className="text-red-400 text-sm">{error}</div>}
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
      </div>

      {/* Payment Methods */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Payment Methods</h2>
          <button
            onClick={() => setShowAddPayment(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            + Add Payment Method
          </button>
        </div>

        {showAddPayment && (
          <form onSubmit={handleAddPayment} className="mb-6 p-4 bg-slate-700 rounded-lg">
            <h3 className="text-white font-semibold mb-4">Add Payment Method</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {paymentType === 'VENMO' || paymentType === 'CASH_APP' ? 'Username' :
                   paymentType === 'APPLE_PAY' || paymentType === 'PAYPAL' ? 'Email/Phone' :
                   'Account Info'}
                </label>
                <input
                  type="text"
                  value={paymentIdentifier}
                  onChange={(e) => setPaymentIdentifier(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nickname (optional)</label>
                <input
                  type="text"
                  value={paymentNickname}
                  onChange={(e) => setPaymentNickname(e.target.value)}
                  placeholder="e.g., My Venmo"
                  className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {profile.paymentMethods.length === 0 ? (
            <div className="text-slate-400 text-center py-8">No payment methods added yet</div>
          ) : (
            profile.paymentMethods.map((method: any) => (
              <div key={method.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div>
                  <div className="text-white font-semibold">
                    {PAYMENT_TYPE_LABELS[method.type]}
                    {method.isDefault && (
                      <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded">DEFAULT</span>
                    )}
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
