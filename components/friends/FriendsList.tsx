'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FriendActivityPreview } from './FriendActivityPreview'
import { EmptyState } from '@/components/ui'

type Friend = {
  id: string
  username: string
  displayName: string
  shareStatsWithFriends: boolean
}

export function FriendsList({
  friends,
  onUnfriended,
}: {
  friends: Friend[]
  onUnfriended: (id: string) => void
}) {
  const [confirming, setConfirming] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const doUnfriend = async (friendId: string) => {
    setActionLoading(friendId)
    setErrors(prev => ({ ...prev, [friendId]: '' }))
    try {
      const res = await fetch(`/api/friends/${friendId}`, { method: 'DELETE' })
      if (res.ok) {
        onUnfriended(friendId)
      } else {
        const data = await res.json()
        setErrors(prev => ({ ...prev, [friendId]: data.error || 'Failed to unfriend' }))
      }
    } finally {
      setActionLoading(null)
      setConfirming(null)
    }
  }

  if (friends.length === 0) {
    return <EmptyState message="No friends yet. Search by username or phone above." />
  }

  return (
    <div className="space-y-3">
      {friends.map(friend => (
        <div key={friend.id} className="glass-card chip-border-white rounded-xl px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-on-surface font-semibold">@{friend.username}</span>
                <span className="text-on-surface-variant text-sm">{friend.displayName}</span>
                {friend.shareStatsWithFriends && (
                  <Link
                    href={`/stats/${friend.username}`}
                    className="text-xs border border-chip-green/35 chip-text-green hover:bg-chip-green-dim px-2 py-0.5 rounded-md transition-all duration-150"
                  >
                    View stats
                  </Link>
                )}
              </div>

              {friend.shareStatsWithFriends && (
                <FriendActivityPreview userId={friend.id} />
              )}

              {errors[friend.id] && (
                <p className="chip-text-red text-xs mt-1">{errors[friend.id]}</p>
              )}
            </div>

            <div className="shrink-0">
              {confirming === friend.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => doUnfriend(friend.id)}
                    disabled={actionLoading === friend.id}
                    className="text-xs chip-text-red hover:opacity-80 disabled:opacity-50 transition-opacity"
                  >
                    {actionLoading === friend.id ? 'Removing…' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(friend.id)}
                  className="text-xs text-on-surface-variant hover:chip-text-red transition-colors"
                >
                  Unfriend
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
