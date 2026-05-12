'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import EventModal from '@/components/EventModal'
import SettlementView from '@/components/SettlementView'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import HostDashboard from './HostDashboard'
import PlayerDashboard from './PlayerDashboard'
import type { PlayerStat } from './types'

const QRCode = dynamic(() => import('@/components/QRCode'), { ssr: false })

export default function RoomPage() {
  const params = useParams()
  const { data: session } = useSession()
  const code = (params.code as string).toUpperCase()

  const [room, setRoom] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventType, setEventType] = useState<'BUY_IN' | 'REBUY' | 'CASH_OUT'>('BUY_IN')
  const [showSettlement, setShowSettlement] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [copiedRoomCode, setCopiedRoomCode] = useState(false)
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null)

  const fetchRoom = async () => {
    const res = await fetch(`/api/rooms/${code}`)
    try {
      const data = await res.json()
      if (res.ok) { setRoom(data); setError('') }
      else setError(data.error || 'Failed to load room')
    } catch {
      setError('Failed to load room data')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRoom()
    const interval = setInterval(fetchRoom, 2000)
    return () => clearInterval(interval)
  }, [code])

  useEffect(() => {
    if (!showQR) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowQR(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showQR])

  const handleEndRoom = async () => {
    if (!confirm('End this room? This will compute final settlement.')) return
    const res = await fetch(`/api/rooms/${code}/end`, { method: 'POST' })
    if (res.ok) { fetchRoom(); setShowSettlement(true) }
    else { const data = await res.json(); alert(data.error || 'Failed to end room') }
  }

  const handleCopyRoomCode = async () => {
    if (!room) return
    await navigator.clipboard.writeText(room.code)
    setCopiedRoomCode(true)
    window.setTimeout(() => setCopiedRoomCode(false), 1500)
  }

  const handleCashOutAction = async (requestId: string, action: 'approve' | 'reject') => {
    setRequestActionLoading(requestId + action)
    const res = await fetch(`/api/rooms/${code}/cashout-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setRequestActionLoading(null)
    if (!res.ok) { const data = await res.json(); alert(data.error || `Failed to ${action} cash-out request`) }
    fetchRoom()
  }

  const handleBuyInAction = async (requestId: string, action: 'approve' | 'reject') => {
    setRequestActionLoading(requestId + action)
    const res = await fetch(`/api/rooms/${code}/buyin-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setRequestActionLoading(null)
    if (!res.ok) { const data = await res.json(); alert(data.error || `Failed to ${action} buy-in request`) }
    fetchRoom()
  }

  const openEvent = (type: 'BUY_IN' | 'REBUY' | 'CASH_OUT') => {
    setEventType(type)
    setShowEventModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-on-surface-variant text-sm">Loading…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="chip-text-red text-lg mb-4">{error}</div>
          <Link href="/rooms" className="text-on-surface-variant hover:text-on-surface transition-colors duration-150">← Back to rooms</Link>
        </div>
      </div>
    )
  }

  if (!room) return null

  // ── Derived state ────────────────────────────────────────────────────
  const settings = room.settings as any
  const currentUserId = (session?.user as any)?.id
  const isHost = room.hostId === currentUserId

  const playerStats: PlayerStat[] = room.members.map((member: any) => {
    const userEvents = room.events.filter((e: any) => e.userId === member.userId)
    const totalBuyIn = userEvents
      .filter((e: any) => e.type === 'BUY_IN' || e.type === 'REBUY')
      .reduce((sum: number, e: any) => sum + e.amount, 0)
    const totalCashOut = userEvents
      .filter((e: any) => e.type === 'CASH_OUT')
      .reduce((sum: number, e: any) => sum + e.amount, 0)
    const pendingRequest = room.cashOutRequests?.find(
      (r: any) => r.userId === member.userId && r.status === 'PENDING'
    ) ?? null
    return { user: member.user, totalBuyIn, totalCashOut, net: totalCashOut - totalBuyIn, pendingRequest }
  })

  const totalBuyIns = playerStats.reduce((sum, p) => sum + p.totalBuyIn, 0)
  const totalCashOuts = playerStats.reduce((sum, p) => sum + p.totalCashOut, 0)
  const tableBalance = totalBuyIns - totalCashOuts
  const pendingCashOutRequests = (room.cashOutRequests ?? []).filter((r: any) => r.status === 'PENDING')
  const pendingBuyInRequests = (room.buyInRequests ?? []).filter((r: any) => r.status === 'PENDING')

  const sharedProps = {
    room,
    code,
    settings,
    currentUserId,
    playerStats,
    totalBuyIns,
    totalCashOuts,
    tableBalance,
    pendingCashOutRequests,
    pendingBuyInRequests,
    requestActionLoading,
    copiedRoomCode,
    onOpenEvent: openEvent,
    onEndRoom: handleEndRoom,
    onCopyRoomCode: handleCopyRoomCode,
    onCashOutAction: handleCashOutAction,
    onBuyInAction: handleBuyInAction,
    onShowQR: () => setShowQR(true),
    onShowSettlement: () => setShowSettlement(true),
  }

  return (
    <>
      {isHost
        ? <HostDashboard {...sharedProps} />
        : <PlayerDashboard {...sharedProps} />
      }

      {/* Shared modals */}
      {showEventModal && (
        <EventModal
          roomCode={code}
          eventType={eventType}
          defaultAmount={settings.defaultBuyIn}
          isHost={isHost}
          chipTypes={room.chipTypes}
          onClose={() => setShowEventModal(false)}
          onSuccess={() => { setShowEventModal(false); fetchRoom() }}
        />
      )}
      {showSettlement && (
        <SettlementView roomCode={code} onClose={() => setShowSettlement(false)} />
      )}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl"
          style={{ background: 'rgba(13,13,18,0.88)' }}
          onMouseDown={() => setShowQR(false)}
        >
          <div
            className="relative w-full max-w-[min(92vw,680px)] rounded-2xl border border-outline bg-surface p-6 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQR(false)}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-raised border border-outline text-on-surface-variant hover:text-on-surface transition-colors duration-150"
            >✕</button>
            <div className="flex flex-col items-center gap-6">
              <QRCode
                value={`${window.location.origin}/rooms/join?code=${room.code}`}
                size={620}
                label={`QR code for room ${room.code}`}
              />
              <div className="text-center">
                <p className="text-base font-semibold text-on-surface">Scan to join — works in any browser</p>
                <p className="text-sm text-on-surface-variant mt-1">
                  Room code: <span className="font-mono text-on-surface">{room.code}</span>
                </p>
                <button
                  onClick={handleCopyRoomCode}
                  className="mt-4 h-9 px-5 rounded-xl border border-outline bg-surface-raised text-on-surface text-sm font-medium hover:bg-outline transition-colors duration-150"
                >
                  {copiedRoomCode ? 'Copied!' : 'Copy Room Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
