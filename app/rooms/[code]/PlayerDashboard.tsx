'use client'

import { useState, useEffect } from 'react'
import { centsToUSD, formatTimestamp } from '@/lib/utils'
import type { RoomDashboardProps } from './types'
import { BackLink } from '@/components/ui'

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
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <BackLink href="/rooms" label="Back to rooms" />

      {/* Room info */}
      <div className="bg-surface border border-outline rounded-2xl p-5 mb-5">
        <h1 className="text-xl font-bold text-on-surface mb-2">{settings.name}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-on-surface-variant">
          <span>
            Code:{' '}
            <button
              onClick={onCopyRoomCode}
              className="font-mono text-on-surface hover:chip-text-green transition-colors duration-150"
            >
              {code} {copiedRoomCode ? '✓' : '⎘'}
            </button>
          </span>
          <span>Host: <span className="text-on-surface">{room.host.name}</span></span>
          {settings.blinds && <span>Blinds: <span className="text-on-surface">{settings.blinds}</span></span>}
        </div>
        {room.endedAt && (
          <div className="mt-3 text-sm text-warning font-medium">This room has ended.</div>
        )}
      </div>

      {/* My stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-surface border border-outline rounded-xl p-4">
          <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">My Buy-ins</div>
          <div className="text-lg font-bold text-on-surface">${centsToUSD(myStats?.totalBuyIn ?? 0)}</div>
        </div>
        <div className="bg-surface border border-outline rounded-xl p-4">
          <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">Cashed Out</div>
          <div className="text-lg font-bold text-on-surface-variant">${centsToUSD(myStats?.totalCashOut ?? 0)}</div>
        </div>
        <div className="bg-surface border border-outline rounded-xl p-4">
          <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">My Net</div>
          <div className={`text-lg font-bold ${(myStats?.net ?? 0) >= 0 ? 'chip-text-green' : 'chip-text-red'}`}>
            {(myStats?.net ?? 0) >= 0 ? '+' : ''}${centsToUSD(myStats?.net ?? 0)}
          </div>
        </div>
      </div>

      {/* Pending buy-in / rebuy banner */}
      {(myPendingBuyIn || myPendingRebuy) && !room.endedAt && (
        <div className="bg-chip-purple-dim border border-chip-purple/35 rounded-xl px-5 py-4 mb-5 chip-text-purple text-sm">
          Your {myPendingBuyIn ? 'buy-in' : 'rebuy'} request for{' '}
          <span className="font-mono font-bold">
            ${centsToUSD((myPendingBuyIn ?? myPendingRebuy)!.amountCents)}
          </span>{' '}
          is waiting for host approval.
        </div>
      )}

      {/* Pending cash-out banner */}
      {myPendingCashOut && !room.endedAt && (
        <div className="bg-warning/8 border border-warning/25 rounded-xl px-5 py-4 mb-5 text-warning text-sm">
          Your cash-out request for{' '}
          <span className="font-mono font-bold">${centsToUSD(myPendingCashOut.amountCents)}</span>{' '}
          is waiting for host approval.
        </div>
      )}

      {/* Action buttons */}
      {!room.endedAt && (
        <div className="flex gap-2 mb-5">
          {(playerState === 'NEVER_BOUGHT_IN' || playerState === 'BUY_IN_PENDING' || playerState === 'CASHED_OUT') ? (
            <button
              onClick={() => { if (playerState !== 'BUY_IN_PENDING') onOpenEvent('BUY_IN') }}
              disabled={playerState === 'BUY_IN_PENDING'}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 active:scale-95 ${
                playerState === 'BUY_IN_PENDING'
                  ? 'bg-surface-raised border border-outline text-on-surface-variant opacity-60 pointer-events-none'
                  : 'bg-primary text-on-primary'
              }`}
            >
              {playerState === 'BUY_IN_PENDING' ? 'Buy-in Pending…' : 'Buy In'}
            </button>
          ) : (
            <>
              <button
                onClick={() => { if (playerState !== 'REBUY_PENDING') onOpenEvent('REBUY') }}
                disabled={playerState === 'REBUY_PENDING'}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 active:scale-95 ${
                  playerState === 'REBUY_PENDING'
                    ? 'bg-chip-purple-dim border border-chip-purple/35 chip-text-purple opacity-60 pointer-events-none'
                    : 'bg-chip-purple-dim border border-chip-purple/35 chip-text-purple hover:bg-chip-purple/20'
                }`}
              >
                {playerState === 'REBUY_PENDING' ? 'Rebuy Pending…' : 'Rebuy'}
              </button>
              <button
                onClick={() => { if (playerState !== 'CASH_OUT_PENDING') onOpenEvent('CASH_OUT') }}
                disabled={playerState === 'CASH_OUT_PENDING'}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 active:scale-95 ${
                  playerState === 'CASH_OUT_PENDING'
                    ? 'bg-chip-green-dim border border-chip-green/35 chip-text-green opacity-60 pointer-events-none'
                    : 'bg-chip-green-dim border border-chip-green/35 chip-text-green hover:bg-chip-green/20'
                }`}
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
          className="w-full h-11 mb-5 bg-primary text-on-primary rounded-xl font-semibold active:scale-95 transition-all duration-150"
        >
          View Settlement
        </button>
      )}

      {/* Personal transaction history */}
      <div className="bg-surface border border-outline rounded-2xl p-5">
        <h2 className="text-base font-bold text-on-surface mb-4">My Transactions</h2>

        {(myPendingBuyIn || myPendingRebuy || myPendingCashOut) && (
          <div className="mb-5">
            <div className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold mb-2">Pending</div>
            <div className="space-y-2">
              {[myPendingBuyIn, myPendingRebuy].filter(Boolean).map((req: any) => (
                <div key={req.id} className="flex justify-between items-center bg-chip-purple-dim border border-chip-purple/35 rounded-xl px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-chip-purple-text opacity-60" />
                    <span className="chip-text-purple italic">
                      {req.type === 'BUY_IN' ? 'Buy In' : 'Rebuy'} — awaiting approval
                    </span>
                  </div>
                  <span className="font-mono chip-text-purple font-bold">${centsToUSD(req.amountCents)}</span>
                </div>
              ))}
              {myPendingCashOut && (
                <div className="flex justify-between items-center bg-warning/8 border border-warning/25 rounded-xl px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning opacity-60" />
                    <span className="text-warning italic">Cash Out — awaiting approval</span>
                  </div>
                  <span className="font-mono text-warning font-bold">${centsToUSD(myPendingCashOut.amountCents)}</span>
                </div>
              )}
            </div>
          </div>
        )}

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
                <div className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold mb-2">Confirmed</div>
              )}
              <div className="space-y-1.5 mb-5">
                {chronological.map((event: any) => {
                  if (event.type === 'BUY_IN' || event.type === 'REBUY') runningBalance -= event.amount
                  else runningBalance += event.amount
                  const balColor = runningBalance > 0 ? 'chip-text-green' : runningBalance < 0 ? 'chip-text-red' : 'text-on-surface-variant'
                  const typeLabel = event.type === 'BUY_IN' ? 'Buy In' : event.type === 'REBUY' ? 'Rebuy' : 'Cash Out'
                  const dotColor = event.type === 'CASH_OUT' ? 'bg-chip-green-text' : 'bg-on-surface'
                  const amtColor = event.type === 'CASH_OUT' ? 'chip-text-green' : 'text-on-surface'
                  return (
                    <div key={event.id} className="flex items-center justify-between bg-surface-raised rounded-xl px-4 py-3 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                          <span className="text-on-surface font-medium">{typeLabel}</span>
                          <span className={`font-mono font-bold ${amtColor}`}>${centsToUSD(event.amount)}</span>
                        </div>
                        <span className="text-on-surface-variant text-xs pl-4">{formatTimestamp(event.createdAt)}</span>
                      </div>
                      <div className={`font-mono font-semibold text-sm ${balColor}`}>
                        {runningBalance >= 0 ? '+' : ''}${centsToUSD(runningBalance)}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary */}
              <div className="border-t border-outline pt-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Total bought in</span>
                  <span className="font-mono text-on-surface font-semibold">${centsToUSD(myStats?.totalBuyIn ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Total cashed out</span>
                  <span className="font-mono text-on-surface-variant font-semibold">${centsToUSD(myStats?.totalCashOut ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-outline pt-2.5">
                  <span className="text-on-surface">Net P&amp;L</span>
                  <span className={`font-mono ${net >= 0 ? 'chip-text-green' : 'chip-text-red'}`}>
                    {net >= 0 ? '+' : ''}${centsToUSD(net)}
                  </span>
                </div>
                {startMs !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Session duration</span>
                    <span className="font-mono text-on-surface-variant flex items-center gap-1">
                      {formatDuration(durationMs)}
                      {!firstCashOut && !room.endedAt && <span className="chip-text-green text-xs">●</span>}
                    </span>
                  </div>
                )}
                {hourlyRate !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Hourly rate</span>
                    <span className={`font-mono font-semibold ${hourlyRate >= 0 ? 'chip-text-green' : 'chip-text-red'}`}>
                      {hourlyRate >= 0 ? '+' : '−'}${Math.abs(hourlyRate).toFixed(2)}/hr
                    </span>
                  </div>
                )}
              </div>
            </>
          )
        })() : !myPendingBuyIn && !myPendingRebuy && !myPendingCashOut ? (
          <div className="text-on-surface-variant text-sm text-center py-10">
            No transactions yet. Buy in to get started.
          </div>
        ) : null}
      </div>
    </div>
  )
}
