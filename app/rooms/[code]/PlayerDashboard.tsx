'use client'

import Link from 'next/link'
import { centsToUSD, formatTimestamp } from '@/lib/utils'
import type { RoomDashboardProps } from './types'

export default function PlayerDashboard({
  room,
  code,
  settings,
  currentUserId,
  playerStats,
  tableBalance,
  pendingCashOutRequests,
  pendingBuyInRequests,
  copiedRoomCode,
  onOpenEvent,
  onCopyRoomCode,
  onShowSettlement,
}: RoomDashboardProps) {
  const myStats = playerStats.find((p) => p.user.id === currentUserId)
  const myPendingCashOut = pendingCashOutRequests.find((r: any) => r.userId === currentUserId)
  const myPendingBuyIn = pendingBuyInRequests.find((r: any) => r.userId === currentUserId)
  const myEvents = room.events.filter((e: any) => e.userId === currentUserId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Link href="/rooms" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to rooms
        </Link>

        {/* Room info */}
        <div className="bg-slate-800 rounded-xl p-6 mb-5">
          <h1 className="text-2xl font-bold text-white mb-2">{settings.name}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            <span>
              Code:{' '}
              <button
                onClick={onCopyRoomCode}
                className="font-mono text-white hover:text-blue-300 transition"
              >
                {code} {copiedRoomCode ? '✓' : '⎘'}
              </button>
            </span>
            <span>Host: <span className="text-white">{room.host.name}</span></span>
            {settings.blinds && <span>Blinds: <span className="text-white">{settings.blinds}</span></span>}
          </div>
          {room.endedAt && (
            <div className="mt-3 text-sm text-amber-400 font-medium">This room has ended.</div>
          )}
        </div>

        {/* My stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">My Buy-ins</div>
            <div className="text-xl font-bold text-blue-400">${centsToUSD(myStats?.totalBuyIn ?? 0)}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Cashed Out</div>
            <div className="text-xl font-bold text-slate-300">${centsToUSD(myStats?.totalCashOut ?? 0)}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">My Net</div>
            <div className={`text-xl font-bold ${(myStats?.net ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(myStats?.net ?? 0) >= 0 ? '+' : ''}${centsToUSD(myStats?.net ?? 0)}
            </div>
          </div>
        </div>

        {/* Pending buy-in banner */}
        {myPendingBuyIn && !room.endedAt && (
          <div className="bg-blue-950 border border-blue-600 rounded-xl px-5 py-4 mb-5 text-blue-300 text-sm">
            Your {myPendingBuyIn.type === 'BUY_IN' ? 'buy-in' : 'rebuy'} request for{' '}
            <span className="font-mono font-bold">${centsToUSD(myPendingBuyIn.amountCents)}</span>{' '}
            is waiting for host approval.
          </div>
        )}

        {/* Pending cash-out banner */}
        {myPendingCashOut && !room.endedAt && (
          <div className="bg-amber-950 border border-amber-600 rounded-xl px-5 py-4 mb-5 text-amber-300 text-sm">
            Your cash-out request for{' '}
            <span className="font-mono font-bold">${centsToUSD(myPendingCashOut.amountCents)}</span>{' '}
            is waiting for host approval.
          </div>
        )}

        {/* Action buttons */}
        {!room.endedAt && (
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => {
                if (myPendingBuyIn) { alert('Your buy-in request is already pending host approval.'); return }
                onOpenEvent('BUY_IN')
              }}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
            >
              {myPendingBuyIn ? 'Pending…' : 'Buy In'}
            </button>
            <button
              onClick={() => {
                if (myPendingBuyIn) { alert('Your buy-in request is already pending host approval.'); return }
                onOpenEvent('REBUY')
              }}
              className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium text-sm"
            >
              {myPendingBuyIn ? 'Pending…' : 'Rebuy'}
            </button>
            <button
              onClick={() => {
                if (myPendingCashOut) { alert('Your cash-out request is already pending host approval.'); return }
                onOpenEvent('CASH_OUT')
              }}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm"
            >
              {myPendingCashOut ? 'Pending…' : 'Cash Out'}
            </button>
          </div>
        )}

        {room.endedAt && (
          <button
            onClick={onShowSettlement}
            className="w-full py-3 mb-5 bg-green-700 hover:bg-green-600 text-white rounded-xl font-semibold"
          >
            View Settlement
          </button>
        )}

        {/* Table info + player list */}
        <div className="bg-slate-800 rounded-xl p-6 mb-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Table</h2>
            <span className="text-sm text-slate-400">
              Balance:{' '}
              <span className="text-white font-mono font-semibold">${centsToUSD(tableBalance)}</span>
            </span>
          </div>
          <div className="space-y-2">
            {playerStats.map((stat) => {
              const isMe = stat.user.id === currentUserId
              const hasCashedOut = stat.totalCashOut > 0
              return (
                <div
                  key={stat.user.id}
                  className={`flex items-center justify-between rounded-lg px-4 py-2.5 ${
                    isMe ? 'bg-blue-900/30 border border-blue-800' : 'bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${hasCashedOut ? 'bg-slate-500' : 'bg-green-400'}`} />
                    <span className="text-white text-sm font-medium">
                      {stat.user.name}
                      {stat.user.id === room.hostId && (
                        <span className="text-xs text-blue-400 ml-1">(host)</span>
                      )}
                      {isMe && <span className="text-xs text-slate-400 ml-1">(you)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingBuyInRequests.some((r: any) => r.userId === stat.user.id) && (
                      <span className="text-xs text-blue-400">buy-in pending</span>
                    )}
                    {stat.pendingRequest && (
                      <span className="text-xs text-amber-400">cash-out pending</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      hasCashedOut ? 'bg-slate-700 text-slate-400' : 'bg-green-900/50 text-green-400'
                    }`}>
                      {hasCashedOut ? 'out' : 'playing'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* My activity */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">My Activity</h2>
          {myEvents.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-6">No activity yet</div>
          ) : (
            <div className="space-y-2">
              {[...myEvents].reverse().map((event: any) => (
                <div
                  key={event.id}
                  className="flex justify-between items-center bg-slate-700 rounded-lg px-4 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${event.type === 'CASH_OUT' ? 'bg-green-400' : 'bg-blue-400'}`} />
                    <span className="text-slate-300">
                      {event.type === 'BUY_IN' ? 'Bought in' : event.type === 'REBUY' ? 'Rebuy' : 'Cashed out'}
                    </span>
                    <span className={`font-bold font-mono ${event.type === 'CASH_OUT' ? 'text-green-400' : 'text-blue-400'}`}>
                      ${centsToUSD(event.amount)}
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs">{formatTimestamp(event.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
