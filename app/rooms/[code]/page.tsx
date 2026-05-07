'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { centsToUSD, formatTimestamp } from '@/lib/utils'
import EventModal from '@/components/EventModal'
import SettlementView from '@/components/SettlementView'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'

const QRCode = dynamic(() => import('@/components/QRCode'), { ssr: false })

type Room = any

export default function RoomPage() {
  const params = useParams()
  const { data: session } = useSession()
  const code = (params.code as string).toUpperCase()

  const [room, setRoom] = useState<Room | null>(null)
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
      if (res.ok) {
        setRoom(data)
        setError('')
      } else {
        setError(data.error || 'Failed to load room')
      }
    } catch (err) {
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowQR(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showQR])

  const handleEndRoom = async () => {
    if (!confirm('End this room? This will compute final settlement.')) return
    const res = await fetch(`/api/rooms/${code}/end`, { method: 'POST' })
    if (res.ok) {
      fetchRoom()
      setShowSettlement(true)
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to end room')
    }
  }

  const handleCopyRoomCode = async () => {
    if (!room) return
    await navigator.clipboard.writeText(room.code)
    setCopiedRoomCode(true)
    window.setTimeout(() => setCopiedRoomCode(false), 1500)
  }

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    setRequestActionLoading(requestId + action)
    const res = await fetch(`/api/rooms/${code}/cashout-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setRequestActionLoading(null)
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || `Failed to ${action} request`)
    }
    fetchRoom()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <Link href="/rooms" className="text-blue-400 hover:text-blue-300">
            ← Back to rooms
          </Link>
        </div>
      </div>
    )
  }

  if (!room) return null

  const settings = room.settings as any
  const currentUserId = (session?.user as any)?.id
  const isHost = room.hostId === currentUserId

  const playerStats = room.members.map((member: any) => {
    const userEvents = room.events.filter((e: any) => e.userId === member.userId)
    const totalBuyIn = userEvents
      .filter((e: any) => e.type === 'BUY_IN' || e.type === 'REBUY')
      .reduce((sum: number, e: any) => sum + e.amount, 0)
    const totalCashOut = userEvents
      .filter((e: any) => e.type === 'CASH_OUT')
      .reduce((sum: number, e: any) => sum + e.amount, 0)
    const net = totalCashOut - totalBuyIn
    const pendingRequest = room.cashOutRequests?.find(
      (r: any) => r.userId === member.userId && r.status === 'PENDING'
    )

    return { user: member.user, totalBuyIn, totalCashOut, net, pendingRequest }
  })

  const totalBuyIns = playerStats.reduce((sum: number, p: any) => sum + p.totalBuyIn, 0)
  const totalCashOuts = playerStats.reduce((sum: number, p: any) => sum + p.totalCashOut, 0)
  const tableBalance = totalBuyIns - totalCashOuts

  const pendingRequests = (room.cashOutRequests ?? []).filter((r: any) => r.status === 'PENDING')

  const myPendingRequest = pendingRequests.find((r: any) => r.userId === currentUserId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/rooms" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to rooms
        </Link>

        {/* Header */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{settings.name}</h1>
              <div className="flex gap-4 text-sm text-slate-400 mb-4">
                <div>Code: <span className="font-mono text-white">{room.code}</span></div>
                <div>Host: {room.host.name}</div>
                <div>Blinds: {settings.blinds || 'N/A'}</div>
              </div>
            </div>
            <div className="flex gap-2">
              {isHost && (
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {showQR ? 'Hide QR Code' : 'Show QR Code'}
                </button>
              )}
              {room.endedAt ? (
                <button
                  onClick={() => setShowSettlement(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  View Settlement
                </button>
              ) : (
                <>
                  {isHost && (
                    <button
                      onClick={handleEndRoom}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                      End Room
                    </button>
                  )}
                  <button
                    onClick={() => setShowSettlement(true)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  >
                    Preview Settlement
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Total In</div>
              <div className="text-2xl font-bold text-green-400">${centsToUSD(totalBuyIns)}</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Total Out</div>
              <div className="text-2xl font-bold text-red-400">${centsToUSD(totalCashOuts)}</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Table Balance</div>
              <div className="text-2xl font-bold text-white">${centsToUSD(tableBalance)}</div>
            </div>
          </div>
        </div>

        {/* Host-only: Pending Cash Out Requests */}
        {isHost && !room.endedAt && pendingRequests.length > 0 && (
          <div className="bg-amber-950 border border-amber-600 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-amber-400 mb-4">
              Pending Cash Out Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-3">
              {pendingRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between bg-amber-900/40 rounded-lg px-4 py-3">
                  <div>
                    <span className="font-semibold text-white">{req.user.name}</span>
                    <span className="text-amber-300 ml-3 font-mono">${centsToUSD(req.amountCents)}</span>
                    <span className="text-slate-400 text-xs ml-3">{formatTimestamp(req.createdAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestAction(req.id, 'approve')}
                      disabled={requestActionLoading !== null}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
                    >
                      {requestActionLoading === req.id + 'approve' ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleRequestAction(req.id, 'reject')}
                      disabled={requestActionLoading !== null}
                      className="px-3 py-1.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
                    >
                      {requestActionLoading === req.id + 'reject' ? '...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player: own pending request banner */}
        {!isHost && myPendingRequest && !room.endedAt && (
          <div className="bg-amber-950 border border-amber-600 rounded-lg px-5 py-4 mb-6 text-amber-300">
            Your cash out request for <span className="font-mono font-bold">${centsToUSD(myPendingRequest.amountCents)}</span> is waiting for host approval.
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Players */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Players</h2>

            {!room.endedAt && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => { setEventType('BUY_IN'); setShowEventModal(true) }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Buy In
                </button>
                <button
                  onClick={() => { setEventType('REBUY'); setShowEventModal(true) }}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                >
                  Rebuy
                </button>
                <button
                  onClick={() => {
                    if (!isHost && myPendingRequest) {
                      alert('Your cash out request is already pending host approval.')
                      return
                    }
                    setEventType('CASH_OUT')
                    setShowEventModal(true)
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  {!isHost && myPendingRequest ? 'Cash Out (Pending)' : 'Cash Out'}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {playerStats.map((stat: any) => (
                <div key={stat.user.id} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">{stat.user.name}</div>
                      <div className="text-sm text-slate-400">
                        In: ${centsToUSD(stat.totalBuyIn)} | Out: ${centsToUSD(stat.totalCashOut)}
                      </div>
                      {stat.pendingRequest && (
                        <div className="text-xs text-amber-400 mt-1">
                          Pending cash out: ${centsToUSD(stat.pendingRequest.amountCents)}
                        </div>
                      )}
                    </div>
                    <div className={`text-lg font-bold ${stat.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.net >= 0 ? '+' : ''}${centsToUSD(stat.net)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Log */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Audit Log</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {room.events.length === 0 ? (
                <div className="text-slate-400 text-center py-8">No events yet</div>
              ) : (
                room.events.map((event: any) => (
                  <div key={event.id} className="bg-slate-700 rounded p-3 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-white">{event.user.name}</span>
                        <span className="text-slate-400 mx-2">
                          {event.type === 'BUY_IN' ? 'bought in' :
                           event.type === 'REBUY' ? 'rebought' : 'cashed out'}
                        </span>
                        <span className={`font-bold ${
                          event.type === 'CASH_OUT' ? 'text-green-400' : 'text-blue-400'
                        }`}>
                          ${centsToUSD(event.amount)}
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs">
                        {formatTimestamp(event.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showEventModal && (
        <EventModal
          roomCode={code}
          eventType={eventType}
          defaultAmount={settings.defaultBuyIn}
          onClose={() => setShowEventModal(false)}
          onSuccess={() => {
            setShowEventModal(false)
            fetchRoom()
          }}
        />
      )}

      {showSettlement && (
        <SettlementView
          roomCode={code}
          onClose={() => setShowSettlement(false)}
        />
      )}

      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xl"
          onMouseDown={() => setShowQR(false)}
        >
          <div
            className="relative w-full max-w-[min(92vw,680px)] rounded-2xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setShowQR(false)}
              className="absolute right-4 top-4 rounded-full bg-slate-900/90 px-3 py-2 text-white shadow-lg hover:bg-slate-800"
              aria-label="Close QR code"
            >
              ✕
            </button>
            <div className="flex flex-col items-center gap-6">
              <div className="flex w-full justify-center">
                <QRCode value={room.code} size={620} label={`QR code for room ${room.code}`} />
              </div>
              <div className="text-center text-slate-100">
                <p className="text-xl font-semibold">Scan this QR code with the mobile app</p>
                <p className="text-sm text-slate-400 mt-2">
                  Room code: <span className="font-mono text-white">{room.code}</span>
                </p>
                <button
                  onClick={handleCopyRoomCode}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {copiedRoomCode ? 'Copied' : 'Copy Room Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
