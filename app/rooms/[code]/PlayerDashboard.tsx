'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { centsToUSD, formatTimestamp } from '@/lib/utils'
import type { RoomDashboardProps } from './types'

type PlayerState = 'NEVER_BOUGHT_IN' | 'BUY_IN_PENDING' | 'ACTIVE' | 'REBUY_PENDING' | 'CASH_OUT_PENDING' | 'CASHED_OUT'

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h >= 1) return `${h}h ${m}m`
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`
  return `${s}s`
}

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
  const myPendingBuyIn = pendingBuyInRequests.find((r: any) => r.userId === currentUserId && r.type === 'BUY_IN')
  const myPendingRebuy = pendingBuyInRequests.find((r: any) => r.userId === currentUserId && r.type === 'REBUY')
  const myEvents = room.events.filter((e: any) => e.userId === currentUserId)

  // room.events is desc-ordered; myEvents[0] is the player's most recent approved event
  const lastApprovedEvent = myEvents[0]
  const hasEverBoughtIn = myEvents.some((e: any) => e.type === 'BUY_IN' || e.type === 'REBUY')
  const playerState: PlayerState = (() => {
    if (!hasEverBoughtIn && !myPendingBuyIn) return 'NEVER_BOUGHT_IN'
    if (!hasEverBoughtIn) return 'BUY_IN_PENDING'
    if (lastApprovedEvent?.type === 'CASH_OUT') {
      return (myPendingBuyIn || myPendingRebuy) ? 'BUY_IN_PENDING' : 'CASHED_OUT'
    }
    if (myPendingRebuy) return 'REBUY_PENDING'
    if (myPendingCashOut) return 'CASH_OUT_PENDING'
    return 'ACTIVE'
  })()

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (playerState === 'CASHED_OUT' || room.endedAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [playerState, room.endedAt])

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

        {/* Pending buy-in / rebuy banner */}
        {(myPendingBuyIn || myPendingRebuy) && !room.endedAt && (
          <div className="bg-blue-950 border border-blue-600 rounded-xl px-5 py-4 mb-5 text-blue-300 text-sm">
            Your {myPendingBuyIn ? 'buy-in' : 'rebuy'} request for{' '}
            <span className="font-mono font-bold">
              ${centsToUSD((myPendingBuyIn ?? myPendingRebuy)!.amountCents)}
            </span>{' '}
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
            {(playerState === 'NEVER_BOUGHT_IN' || playerState === 'BUY_IN_PENDING' || playerState === 'CASHED_OUT') ? (
              <button
                onClick={() => { if (playerState !== 'BUY_IN_PENDING') onOpenEvent('BUY_IN') }}
                disabled={playerState === 'BUY_IN_PENDING'}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm text-white ${playerState === 'BUY_IN_PENDING' ? 'bg-blue-800 opacity-60' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {playerState === 'BUY_IN_PENDING' ? 'Buy-in Pending…' : 'Buy In'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => { if (playerState !== 'REBUY_PENDING') onOpenEvent('REBUY') }}
                  disabled={playerState === 'REBUY_PENDING'}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-sm text-white ${playerState === 'REBUY_PENDING' ? 'bg-yellow-800 opacity-60' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                >
                  {playerState === 'REBUY_PENDING' ? 'Rebuy Pending…' : 'Rebuy'}
                </button>
                <button
                  onClick={() => { if (playerState !== 'CASH_OUT_PENDING') onOpenEvent('CASH_OUT') }}
                  disabled={playerState === 'CASH_OUT_PENDING'}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-sm text-white ${playerState === 'CASH_OUT_PENDING' ? 'bg-green-800 opacity-60' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {playerState === 'CASH_OUT_PENDING' ? 'Cash-out Pending…' : 'Cash Out'}
                </button>
              </>
            )}
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

        {/* Personal transaction history */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">My Transactions</h2>

          {/* Pending requests */}
          {(myPendingBuyIn || myPendingRebuy || myPendingCashOut) && (
            <div className="mb-5">
              <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Pending</div>
              <div className="space-y-2">
                {[myPendingBuyIn, myPendingRebuy].filter(Boolean).map((req: any) => (
                  <div key={req.id} className="flex justify-between items-center bg-blue-950/50 border border-blue-800/60 rounded-lg px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 opacity-60" />
                      <span className="text-blue-300 italic">
                        {req.type === 'BUY_IN' ? 'Buy In' : 'Rebuy'} — awaiting approval
                      </span>
                    </div>
                    <span className="font-mono text-blue-300 font-bold">${centsToUSD(req.amountCents)}</span>
                  </div>
                ))}
                {myPendingCashOut && (
                  <div className="flex justify-between items-center bg-amber-950/50 border border-amber-800/60 rounded-lg px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 opacity-60" />
                      <span className="text-amber-300 italic">Cash Out — awaiting approval</span>
                    </div>
                    <span className="font-mono text-amber-300 font-bold">${centsToUSD(myPendingCashOut.amountCents)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirmed history */}
          {myEvents.length > 0 ? (() => {
            const chronological = [...myEvents].reverse()
            const firstBuyIn = chronological.find((e: any) => e.type === 'BUY_IN' || e.type === 'REBUY')
            const firstCashOut = chronological.find((e: any) => e.type === 'CASH_OUT')
            const startMs = firstBuyIn ? new Date(firstBuyIn.createdAt).getTime() : null
            const endMs = firstCashOut ? new Date(firstCashOut.createdAt).getTime() : now
            const durationMs = startMs ? endMs - startMs : 0
            const durationHours = durationMs / (1000 * 60 * 60)
            const net = myStats?.net ?? 0
            const hourlyRate = firstCashOut && durationHours > (1 / 60) ? net / 100 / durationHours : null

            let runningBalance = 0

            return (
              <>
                {(myPendingBuyIn || myPendingRebuy || myPendingCashOut) && (
                  <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Confirmed</div>
                )}
                <div className="space-y-2 mb-5">
                  {chronological.map((event: any) => {
                    if (event.type === 'BUY_IN' || event.type === 'REBUY') runningBalance -= event.amount
                    else runningBalance += event.amount
                    const balColor = runningBalance > 0 ? 'text-green-400' : runningBalance < 0 ? 'text-red-400' : 'text-slate-400'
                    const typeLabel = event.type === 'BUY_IN' ? 'Buy In' : event.type === 'REBUY' ? 'Rebuy' : 'Cash Out'
                    const dotColor = event.type === 'CASH_OUT' ? 'bg-green-400' : 'bg-blue-400'
                    const amtColor = event.type === 'CASH_OUT' ? 'text-green-400' : 'text-blue-400'
                    return (
                      <div key={event.id} className="flex items-center justify-between bg-slate-700 rounded-lg px-4 py-3 text-sm">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                            <span className="text-white font-medium">{typeLabel}</span>
                            <span className={`font-mono font-bold ${amtColor}`}>${centsToUSD(event.amount)}</span>
                          </div>
                          <span className="text-slate-500 text-xs pl-4">{formatTimestamp(event.createdAt)}</span>
                        </div>
                        <div className={`font-mono font-semibold text-sm ${balColor}`}>
                          {runningBalance >= 0 ? '+' : ''}${centsToUSD(runningBalance)}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Summary */}
                <div className="border-t border-slate-700 pt-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total bought in</span>
                    <span className="font-mono text-blue-300 font-semibold">${centsToUSD(myStats?.totalBuyIn ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total cashed out</span>
                    <span className="font-mono text-slate-300 font-semibold">${centsToUSD(myStats?.totalCashOut ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-slate-700 pt-2.5">
                    <span className="text-slate-200">Net P&amp;L</span>
                    <span className={`font-mono ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {net >= 0 ? '+' : ''}${centsToUSD(net)}
                    </span>
                  </div>
                  {startMs !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Session duration</span>
                      <span className="font-mono text-slate-300 flex items-center gap-1">
                        {formatDuration(durationMs)}
                        {!firstCashOut && !room.endedAt && <span className="text-green-400 text-xs">●</span>}
                      </span>
                    </div>
                  )}
                  {hourlyRate !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Hourly rate</span>
                      <span className={`font-mono font-semibold ${hourlyRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {hourlyRate >= 0 ? '+' : '−'}${Math.abs(hourlyRate).toFixed(2)}/hr
                      </span>
                    </div>
                  )}
                </div>
              </>
            )
          })() : !myPendingBuyIn && !myPendingRebuy && !myPendingCashOut ? (
            <div className="text-slate-400 text-sm text-center py-10">
              No transactions yet. Buy in to get started.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
