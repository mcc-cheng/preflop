'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageShell, BackLink, Card, InlineError, EmptyState, ListItemCard, Avatar } from '@/components/ui'

export default function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [searchUsername, setSearchUsername] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFriends()
    fetchPendingRequests()
  }, [])

  const fetchFriends = async () => {
    const res = await fetch('/api/friends')
    if (res.ok) {
      const data = await res.json()
      setFriends(data.friends || data)
    }
  }

  const fetchPendingRequests = async () => {
    const res = await fetch('/api/friends/requests')
    if (res.ok) {
      const data = await res.json()
      setPendingRequests(data.requests || data)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSearchResult(null)

    const res = await fetch(`/api/friends/search?username=${searchUsername}`)
    if (res.ok) {
      const data = await res.json()
      setSearchResult(data)
    } else {
      const data = await res.json()
      setError(data.error || 'User not found')
    }
    setLoading(false)
  }

  const handleSendRequest = async (receiverId: string) => {
    const res = await fetch('/api/friends/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId }),
    })

    if (res.ok) {
      setSearchResult({ ...searchResult, hasPendingRequest: true, requestSentByMe: true })
    }
  }

  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    const res = await fetch(`/api/friends/requests/${requestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

    if (res.ok) {
      fetchPendingRequests()
      fetchFriends()
    }
  }

  const formatStats = (stats: any) => {
    if (!stats) return 'No stats yet'
    const hourly = stats.hoursPlayed > 0 ? (stats.totalWinnings / 100 / stats.hoursPlayed).toFixed(2) : '0.00'
    return `${stats.gamesPlayed} games • ${stats.hoursPlayed.toFixed(1)}h • $${(stats.totalWinnings / 100).toFixed(2)} • $${hourly}/hr`
  }

  return (
    <PageShell>
      <BackLink href="/rooms" label="Back to rooms" />

      <h1 className="text-3xl font-bold text-on-surface mb-8">Friends</h1>

      {/* Search Section */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold text-on-surface mb-4">Add Friends</h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            placeholder="Search by username..."
            className="flex-1 px-4 py-2 bg-surface border border-outline text-on-surface rounded-xl focus:outline-none focus:border-chip-green/35 transition-colors duration-150 placeholder:text-on-surface-variant"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-chip-green/35 chip-text-green hover:bg-chip-green-dim disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-200"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <div className="mt-4"><InlineError message={error} /></div>}

        {searchResult && (
          <div className="mt-4 p-4 glass-card chip-border-white rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-on-surface font-semibold">{searchResult.user.name}</div>
                <div className="text-on-surface-variant text-sm">@{searchResult.user.username}</div>
                <div className="text-on-surface-variant text-xs mt-1">{formatStats(searchResult.user.stats)}</div>
              </div>
              <div>
                {searchResult.isFriend ? (
                  <span className="px-4 py-2 border border-chip-green/35 chip-text-green rounded-xl text-sm font-medium">
                    Friends ✓
                  </span>
                ) : searchResult.hasPendingRequest ? (
                  <span className="px-4 py-2 border border-warning/35 text-warning rounded-xl text-sm font-medium">
                    {searchResult.requestSentByMe ? 'Request Sent' : 'Request Received'}
                  </span>
                ) : (
                  <button
                    onClick={() => handleSendRequest(searchResult.user.id)}
                    className="px-4 py-2 border border-chip-green/35 chip-text-green hover:bg-chip-green-dim rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    Add Friend
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-on-surface mb-4">
            Friend Requests ({pendingRequests.length})
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="glass-card chip-border-purple chip-glow-purple p-4 flex items-center justify-between">
                <div>
                  <div className="text-on-surface font-semibold">{request.sender.name}</div>
                  <div className="text-on-surface-variant text-sm">@{request.sender.username}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespondToRequest(request.id, 'accept')}
                    className="px-4 py-2 border border-chip-green/35 chip-text-green hover:bg-chip-green-dim rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespondToRequest(request.id, 'decline')}
                    className="px-4 py-2 text-on-surface-variant hover:text-chip-red-text rounded-xl text-sm font-medium transition-colors duration-200"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Friends List */}
      <Card>
        <h2 className="text-xl font-bold text-on-surface mb-4">My Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <EmptyState message="No friends yet. Search to add some!" />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {friends.map((friend: any) => (
              <Link
                key={friend.id}
                href={`/profile/${friend.username}`}
                className="p-4 glass-card chip-border-white hover:bg-chip-green-dim hover:chip-glow-green rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={friend.name} size="lg" />
                  <div className="flex-1">
                    <div className="text-on-surface font-semibold">{friend.name}</div>
                    <div className="text-on-surface-variant text-sm">@{friend.username}</div>
                    <div className="chip-text-green text-xs mt-1">{formatStats(friend.stats)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  )
}
