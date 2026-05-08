'use client'

import { useState } from 'react'

interface Props {
  roomCode: string
  eventType: 'BUY_IN' | 'REBUY' | 'CASH_OUT'
  defaultAmount: number
  onClose: () => void
  onSuccess: () => void
}

export default function EventModal({ roomCode, eventType, defaultAmount, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState(defaultAmount.toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isCashOut = eventType === 'CASH_OUT'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/rooms/${roomCode}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: eventType,
        amount: parseFloat(amount)
      })
    })

    // 202 = pending cash out request submitted
    if (res.ok || res.status === 202) {
      onSuccess()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create event')
      setLoading(false)
    }
  }

  const title = eventType === 'BUY_IN' ? 'Buy In' : eventType === 'REBUY' ? 'Rebuy' : 'Request Cash Out'
  const submitLabel = isCashOut ? 'Request Cash Out' : 'Submit'
  const submitClassName = {
    BUY_IN: 'flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg',
    REBUY: 'flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white rounded-lg',
    CASH_OUT: 'flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg',
  }[eventType]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>

        {isCashOut && (
          <p className="text-sm text-amber-400 mb-4">
            Your request will be sent to the host for approval.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount (USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
              min="0.01"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={submitClassName}
            >
              {loading ? 'Submitting...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
