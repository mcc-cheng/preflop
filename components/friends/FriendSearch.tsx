'use client'

import { useState, useEffect, useCallback } from 'react'

type FriendshipState = 'none' | 'friends' | 'request_sent' | 'request_received'

type SearchResult = {
  id: string
  username: string
  displayName: string
  friendshipState: FriendshipState
}

function isPhoneLike(q: string) {
  return /^[+\d()\-\s]{7,}$/.test(q.trim())
}

export function FriendSearch({ onFriendAdded }: { onFriendAdded: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({})
  const [localStates, setLocalStates] = useState<Record<string, FriendshipState>>({})

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.results ?? [])
      } else {
        setResults([])
      }
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  const sendRequest = async (targetUserId: string) => {
    setActionLoading(targetUserId)
    setActionErrors(prev => ({ ...prev, [targetUserId]: '' }))
    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.autoAccepted) {
          setLocalStates(prev => ({ ...prev, [targetUserId]: 'friends' }))
          onFriendAdded()
        } else {
          setLocalStates(prev => ({ ...prev, [targetUserId]: 'request_sent' }))
        }
      } else {
        const data = await res.json()
        setActionErrors(prev => ({ ...prev, [targetUserId]: data.error || 'Failed to send request' }))
      }
    } finally {
      setActionLoading(null)
    }
  }

  const acceptRequest = async (targetUserId: string) => {
    // Find the incoming request id by re-fetching
    setActionLoading(targetUserId)
    try {
      const res = await fetch('/api/friends/requests?direction=incoming')
      if (res.ok) {
        const data = await res.json()
        const req = data.requests?.find((r: any) => r.otherUser.id === targetUserId)
        if (req) {
          const acceptRes = await fetch(`/api/friends/requests/${req.id}/accept`, { method: 'POST' })
          if (acceptRes.ok) {
            setLocalStates(prev => ({ ...prev, [targetUserId]: 'friends' }))
            onFriendAdded()
          }
        }
      }
    } finally {
      setActionLoading(null)
    }
  }

  const getState = (r: SearchResult): FriendshipState =>
    localStates[r.id] ?? r.friendshipState

  const actionButton = (r: SearchResult) => {
    const state = getState(r)
    const loading = actionLoading === r.id
    const base = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50'

    if (state === 'friends') {
      return <span className={`${base} border border-chip-green/35 chip-text-green`}>Friends ✓</span>
    }
    if (state === 'request_sent') {
      return <span className={`${base} border border-chip-white/20 text-on-surface-variant`}>Pending</span>
    }
    if (state === 'request_received') {
      return (
        <button
          onClick={() => acceptRequest(r.id)}
          disabled={loading}
          className={`${base} border border-chip-green/35 chip-text-green hover:bg-chip-green-dim`}
        >
          {loading ? '…' : 'Accept'}
        </button>
      )
    }
    return (
      <button
        onClick={() => sendRequest(r.id)}
        disabled={loading}
        className={`${base} border border-chip-green/35 chip-text-green hover:bg-chip-green-dim`}
      >
        {loading ? '…' : 'Add'}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center bg-surface border border-outline rounded-xl px-3 h-11 focus-within:border-chip-green/35 transition-colors duration-150">
        <svg className="w-4 h-4 text-on-surface-variant mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Username or phone number…"
          className="bg-transparent text-on-surface flex-1 focus:outline-none placeholder:text-on-surface-variant"
        />
        {searching && <span className="text-on-surface-variant text-xs ml-2">searching…</span>}
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map(r => (
            <div key={r.id} className="glass-card chip-border-white rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-on-surface font-medium text-sm">@{r.username}</div>
                <div className="text-on-surface-variant text-xs">{r.displayName}</div>
                {actionErrors[r.id] && (
                  <div className="chip-text-red text-xs mt-0.5">{actionErrors[r.id]}</div>
                )}
              </div>
              {actionButton(r)}
            </div>
          ))}
        </div>
      )}

      {query.trim() && !searching && results.length === 0 && (
        <p className="text-on-surface-variant text-sm text-center py-2">No users found</p>
      )}
    </div>
  )
}
