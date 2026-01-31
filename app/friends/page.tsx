'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function FriendsPage() {
  const router = useRouter()
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
      setFriends(data)
    }
  }

  const fetchPendingRequests = async () => {
    const res = await fetch('/api/friends/requests')
    if (res.ok) {
      const data = await res.json()
      setPendingRequests(data)
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
      body: JSON.stringify({ receiverId })
    })

    if (res.ok) {
      setSearchResult({ ...searchResult, hasPendingRequest: true, requestSentByMe: true })
    }
  }

  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    const res = await fetch(`/api/friends/requests/${requestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/rooms" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to rooms
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Friends</h1>

        {/* Search Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Add Friends</h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Search by username..."
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-semibold"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && <div className="mt-4 text-red-400">{error}</div>}

          {searchResult && (
            <div className="mt-4 p-4 bg-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{searchResult.user.name}</div>
                  <div className="text-slate-400 text-sm">@{searchResult.user.username}</div>
                  <div className="text-slate-400 text-xs mt-1">{formatStats(searchResult.user.stats)}</div>
                </div>
                <div>
                  {searchResult.isFriend ? (
                    <span className="px-4 py-2 bg-green-600 text-white rounded-lg">Friends ✓</span>
                  ) : searchResult.hasPendingRequest ? (
                    <span className="px-4 py-2 bg-yellow-600 text-white rounded-lg">
                      {searchResult.requestSentByMe ? 'Request Sent' : 'Request Received'}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(searchResult.user.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Add Friend
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Friend Requests ({pendingRequests.length})</h2>
            <div className="space-y-3">
              {pendingRequests.map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div>
                    <div className="text-white font-semibold">{request.sender.name}</div>
                    <div className="text-slate-400 text-sm">@{request.sender.username}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespondToRequest(request.id, 'accept')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespondToRequest(request.id, 'decline')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">My Friends ({friends.length})</h2>
          {friends.length === 0 ? (
            <div className="text-slate-400 text-center py-8">No friends yet. Search to add some!</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {friends.map((friend: any) => (
                <Link
                  key={friend.id}
                  href={`/profile/${friend.username}`}
                  className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">{friend.name}</div>
                      <div className="text-slate-400 text-sm">@{friend.username}</div>
                      <div className="text-slate-500 text-xs mt-1">{formatStats(friend.stats)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
