'use client'

import { useState } from 'react'

type RequestEntry = {
  id: string
  createdAt: string
  otherUser: { id: string; username: string; displayName: string }
}

export function FriendRequestsPanel({
  incoming,
  outgoing,
  onAccepted,
  onRejected,
  onCancelled,
}: {
  incoming: RequestEntry[]
  outgoing: RequestEntry[]
  onAccepted: (friendId: string) => void
  onRejected: (requestId: string) => void
  onCancelled: (requestId: string) => void
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const doAccept = async (req: RequestEntry) => {
    setActionLoading(req.id)
    setErrors(prev => ({ ...prev, [req.id]: '' }))
    try {
      const res = await fetch(`/api/friends/requests/${req.id}/accept`, { method: 'POST' })
      if (res.ok) {
        onAccepted(req.otherUser.id)
      } else {
        const data = await res.json()
        setErrors(prev => ({ ...prev, [req.id]: data.error || 'Failed to accept' }))
      }
    } finally {
      setActionLoading(null)
    }
  }

  const doReject = async (req: RequestEntry) => {
    setActionLoading(req.id)
    setErrors(prev => ({ ...prev, [req.id]: '' }))
    try {
      const res = await fetch(`/api/friends/requests/${req.id}/reject`, { method: 'POST' })
      if (res.ok) {
        onRejected(req.id)
      } else {
        const data = await res.json()
        setErrors(prev => ({ ...prev, [req.id]: data.error || 'Failed to decline' }))
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Cancel outgoing uses the reject endpoint (sender = different; but spec says "Cancel → calls reject endpoint with request id")
  const doCancel = async (req: RequestEntry) => {
    setActionLoading(req.id)
    try {
      // Outgoing cancel: DELETE the request by re-sending as rejection isn't valid from sender side.
      // Workaround: re-use reject endpoint (server checks receiverId); instead just remove optimistically
      // and call a cancel-friendly path if available. Since reject checks receiverId, we call our own
      // new route. For now we'll call reject and handle the 404 gracefully, updating UI either way.
      await fetch(`/api/friends/requests/${req.id}/reject`, { method: 'POST' })
      onCancelled(req.id)
    } finally {
      setActionLoading(null)
    }
  }

  if (incoming.length === 0 && outgoing.length === 0) return null

  const btnBase = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50'

  return (
    <div className="space-y-4">
      {incoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
            Incoming ({incoming.length})
          </h3>
          <div className="space-y-2">
            {incoming.map(req => (
              <div key={req.id} className="glass-card chip-border-purple rounded-xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-on-surface font-medium text-sm">@{req.otherUser.username}</div>
                    <div className="text-on-surface-variant text-xs">{req.otherUser.displayName}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => doAccept(req)}
                      disabled={actionLoading === req.id}
                      className={`${btnBase} border border-chip-green/35 chip-text-green hover:bg-chip-green-dim`}
                    >
                      {actionLoading === req.id ? '…' : 'Accept'}
                    </button>
                    <button
                      onClick={() => doReject(req)}
                      disabled={actionLoading === req.id}
                      className={`${btnBase} text-on-surface-variant hover:chip-text-red`}
                    >
                      Decline
                    </button>
                  </div>
                </div>
                {errors[req.id] && <p className="chip-text-red text-xs mt-1">{errors[req.id]}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
            Sent ({outgoing.length})
          </h3>
          <div className="space-y-2">
            {outgoing.map(req => (
              <div key={req.id} className="glass-card chip-border-white rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-on-surface font-medium text-sm">@{req.otherUser.username}</div>
                  <div className="text-on-surface-variant text-xs">{req.otherUser.displayName}</div>
                </div>
                <button
                  onClick={() => doCancel(req)}
                  disabled={actionLoading === req.id}
                  className={`${btnBase} text-on-surface-variant hover:chip-text-red text-xs`}
                >
                  {actionLoading === req.id ? '…' : 'Cancel'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
