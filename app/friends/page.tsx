'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageShell, BackLink, Card } from '@/components/ui'
import { FriendSearch } from '@/components/friends/FriendSearch'
import { FriendRequestsPanel } from '@/components/friends/FriendRequestsPanel'
import { FriendsList } from '@/components/friends/FriendsList'

type Friend = {
  id: string
  username: string
  displayName: string
  shareStatsWithFriends: boolean
}

type RequestEntry = {
  id: string
  createdAt: string
  otherUser: { id: string; username: string; displayName: string }
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [incoming, setIncoming] = useState<RequestEntry[]>([])
  const [outgoing, setOutgoing] = useState<RequestEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const [friendsRes, incomingRes, outgoingRes] = await Promise.all([
      fetch('/api/friends'),
      fetch('/api/friends/requests?direction=incoming'),
      fetch('/api/friends/requests?direction=outgoing'),
    ])

    if (friendsRes.ok) {
      const data = await friendsRes.json()
      setFriends(data.friends ?? [])
    }
    if (incomingRes.ok) {
      const data = await incomingRes.json()
      setIncoming(data.requests ?? [])
    }
    if (outgoingRes.ok) {
      const data = await outgoingRes.json()
      setOutgoing(data.requests ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleFriendAdded = useCallback(() => { fetchAll() }, [fetchAll])

  const handleAccepted = useCallback((friendId: string) => {
    setIncoming(prev => prev.filter(r => r.otherUser.id !== friendId))
    fetchAll()
  }, [fetchAll])

  const handleRejected = useCallback((requestId: string) => {
    setIncoming(prev => prev.filter(r => r.id !== requestId))
  }, [])

  const handleCancelled = useCallback((requestId: string) => {
    setOutgoing(prev => prev.filter(r => r.id !== requestId))
  }, [])

  const handleUnfriended = useCallback((friendId: string) => {
    setFriends(prev => prev.filter(f => f.id !== friendId))
  }, [])

  const hasRequests = incoming.length > 0 || outgoing.length > 0

  return (
    <PageShell>
      <BackLink href="/rooms" label="Back to rooms" />

      <h1 className="text-3xl font-bold text-on-surface mb-8">Friends</h1>

      <Card className="mb-6">
        <h2 className="text-lg font-bold text-on-surface mb-4">Find People</h2>
        <FriendSearch onFriendAdded={handleFriendAdded} />
      </Card>

      {!loading && hasRequests && (
        <Card className="mb-6">
          <h2 className="text-lg font-bold text-on-surface mb-4">Friend Requests</h2>
          <FriendRequestsPanel
            incoming={incoming}
            outgoing={outgoing}
            onAccepted={handleAccepted}
            onRejected={handleRejected}
            onCancelled={handleCancelled}
          />
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-bold text-on-surface mb-4">
          My Friends {!loading && `(${friends.length})`}
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-16 bg-chip-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <FriendsList friends={friends} onUnfriended={handleUnfriended} />
        )}
      </Card>
    </PageShell>
  )
}
