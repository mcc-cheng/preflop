'use client'

import { useState, useEffect } from 'react'
import { centsToUSD, formatTimestamp } from '@/lib/utils'
import type { RoomDashboardProps } from './types'
import { BackLink, EmptyState } from '@/components/ui'

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h >= 1) return `${h}h ${m}m`
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`
  return `${s}s`
}

type Tab = 'Players' | 'Requests' | 'Audit Log'

export default function HostDashboard({
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
  onOpenEvent,
  onEndRoom,
  onCashOutAction,
  onBuyInAction,
  onShowQR,
  onShowSettlement,
}: RoomDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Players')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (room.endedAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [room.endedAt])

  const totalPending = pendingBuyInRequests.length + pendingCashOutRequests.length
  const tabs: Tab[] = ['Players', 'Requests', 'Audit Log']

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <BackLink href="/rooms" label="Back to rooms" />

      {/* Header */}
      <div className="bg-surface border border-outline rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-on-surface">{settings.name}</h1>
              <span className="text-xs bg-chip-purple-dim border border-chip-purple/35 chip-text-purple px-2 py-0.5 rounded-full font-semibold">HOST</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mt-1">
              <span>Code: <span className="font-mono text-on-surface">{code}</span></span>
              {settings.blinds && <span>Blinds: <span className="text-on-surface">{settings.blinds}</span></span>}
              {settings.maxPlayers && <span>Max: <span className="text-on-surface">{settings.maxPlayers} players</span></span>}
              <span>Buy-in: <span className="text-on-surface">${centsToUSD(settings.defaultBuyIn)}</span></span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onShowQR}
              className="px-4 py-2 bg-surface-raised border border-outline hover:bg-outline text-on-surface rounded-xl text-sm font-medium transition-colors duration-150"
            >
              QR Code
            </button>
            <button
              onClick={onShowSettlement}
              className="px-4 py-2 bg-surface-raised border border-outline hover:bg-outline text-on-surface rounded-xl text-sm font-medium transition-colors duration-150"
            >
              {room.endedAt ? 'View Settlement' : 'Preview Settlement'}
            </button>
            {!room.endedAt && (
              <button
                onClick={onEndRoom}
                className="px-4 py-2 bg-chip-red-dim border border-chip-red/35 chip-text-red hover:bg-chip-red/20 rounded-xl text-sm font-medium transition-colors duration-150"
              >
                End Room
              </button>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-surface-raised border border-outline rounded-xl p-4">
            <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">Total In</div>
            <div className="text-xl font-bold chip-text-green">${centsToUSD(totalBuyIns)}</div>
          </div>
          <div className="bg-surface-raised border border-outline rounded-xl p-4">
            <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">Total Out</div>
            <div className="text-xl font-bold chip-text-red">${centsToUSD(totalCashOuts)}</div>
          </div>
          <div className="bg-surface-raised border border-outline rounded-xl p-4">
            <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">Table Balance</div>
            <div className="text-xl font-bold text-on-surface">${centsToUSD(tableBalance)}</div>
          </div>
          <div className="bg-surface-raised border border-outline rounded-xl p-4">
            <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">Players</div>
            <div className="text-xl font-bold text-on-surface">{room.members.length}</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!room.endedAt && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => onOpenEvent('BUY_IN')}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-medium text-sm active:scale-95 transition-all duration-150"
          >
            + Buy In
          </button>
          <button
            onClick={() => onOpenEvent('REBUY')}
            className="px-5 py-2.5 bg-chip-purple-dim border border-chip-purple/35 chip-text-purple rounded-xl font-medium text-sm hover:bg-chip-purple/20 active:scale-95 transition-all duration-150"
          >
            + Rebuy
          </button>
          <button
            onClick={() => onOpenEvent('CASH_OUT')}
            className="px-5 py-2.5 bg-chip-green-dim border border-chip-green/35 chip-text-green rounded-xl font-medium text-sm hover:bg-chip-green/20 active:scale-95 transition-all duration-150"
          >
            Cash Out
          </button>
        </div>
      )}

      {/* Tab bar + content */}
      <div className="bg-surface border border-outline rounded-2xl overflow-hidden">
        <div className="flex border-b border-outline">
          {tabs.map((tab) => {
            const isActive = activeTab === tab
            const badge = tab === 'Requests' && totalPending > 0 ? totalPending : null
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors focus:outline-none ${
                  isActive ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab}
                {badge !== null && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-chip-red-dim border border-chip-red/35 chip-text-red'
                      : 'bg-surface-raised text-on-surface-variant'
                  }`}>
                    {badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-chip-green-text rounded-t" />
                )}
              </button>
            )
          })}
        </div>

        <div className="p-6">

          {/* ── Tab: Players ── */}
          {activeTab === 'Players' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-on-surface-variant text-xs uppercase tracking-wide border-b border-outline">
                    <th className="text-left pb-3 pr-4">Player</th>
                    <th className="text-right pb-3 px-4">Bought In</th>
                    <th className="text-right pb-3 px-4">Cashed Out</th>
                    <th className="text-right pb-3 px-4">Net P&amp;L</th>
                    <th className="text-right pb-3 px-4">Time</th>
                    <th className="text-left pb-3 pl-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline">
                  {playerStats.map((stat) => {
                    const isMe = stat.user.id === currentUserId
                    const playerEvents = room.events?.filter((e: any) => e.userId === stat.user.id) ?? []
                    const lastEvent = playerEvents[0]
                    const hasCashedOut = lastEvent?.type === 'CASH_OUT'
                    const chronoEvents = [...playerEvents].reverse()
                    const firstBuyIn = chronoEvents.find((e: any) => e.type === 'BUY_IN' || e.type === 'REBUY')
                    const firstCashOut = chronoEvents.find((e: any) => e.type === 'CASH_OUT')
                    const startMs = firstBuyIn ? new Date(firstBuyIn.createdAt).getTime() : null
                    const endMs = firstCashOut ? new Date(firstCashOut.createdAt).getTime() : now
                    const durationMs = startMs ? endMs - startMs : 0
                    return (
                      <tr key={stat.user.id} className={isMe ? 'bg-chip-white/[0.02]' : ''}>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-on-surface">
                            {stat.user.name}{' '}
                            {isMe && <span className="text-xs chip-text-green">(you)</span>}
                          </div>
                          <div className="text-on-surface-variant text-xs">@{stat.user.username}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-on-surface">
                          ${centsToUSD(stat.totalBuyIn)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-on-surface-variant">
                          {stat.totalCashOut > 0 ? `$${centsToUSD(stat.totalCashOut)}` : '—'}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${stat.net >= 0 ? 'chip-text-green' : 'chip-text-red'}`}>
                          {stat.net >= 0 ? '+' : ''}${centsToUSD(stat.net)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm">
                          {startMs ? (
                            <span className={firstCashOut ? 'text-on-surface-variant' : 'text-on-surface'}>
                              {formatDuration(durationMs)}
                              {!firstCashOut && <span className="chip-text-green ml-1 text-xs">●</span>}
                            </span>
                          ) : (
                            <span className="text-on-surface-variant">—</span>
                          )}
                        </td>
                        <td className="py-3 pl-4">
                          <div className="flex flex-col gap-1">
                            {(() => {
                              const pr = pendingBuyInRequests.find((r: any) => r.userId === stat.user.id)
                              return pr ? (
                                <span className="text-xs bg-chip-purple-dim border border-chip-purple/35 chip-text-purple px-2 py-0.5 rounded-full">
                                  {pr.type === 'BUY_IN' ? 'Buy-in' : 'Rebuy'} pending
                                </span>
                              ) : null
                            })()}
                            {stat.pendingRequest ? (
                              <span className="text-xs bg-warning/10 border border-warning/30 text-warning px-2 py-0.5 rounded-full">
                                Cash-out pending ${centsToUSD(stat.pendingRequest.amountCents)}
                              </span>
                            ) : hasCashedOut ? (
                              <span className="text-xs bg-surface-raised border border-outline text-on-surface-variant px-2 py-0.5 rounded-full">Cashed Out</span>
                            ) : (
                              <span className="text-xs bg-chip-green-dim border border-chip-green/35 chip-text-green px-2 py-0.5 rounded-full">Playing</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Tab: Requests ── */}
          {activeTab === 'Requests' && (
            <div className="space-y-6">
              {pendingBuyInRequests.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold chip-text-purple uppercase tracking-wider mb-3">
                    Buy-In Requests ({pendingBuyInRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingBuyInRequests.map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between bg-chip-purple-dim border border-chip-purple/35 rounded-xl px-4 py-3">
                        <div>
                          <span className="font-semibold text-on-surface">{req.user.name}</span>
                          <span className="text-xs chip-text-purple ml-2 uppercase">{req.type === 'BUY_IN' ? 'Buy In' : 'Rebuy'}</span>
                          <span className="chip-text-purple ml-3 font-mono font-bold">${centsToUSD(req.amountCents)}</span>
                          <span className="text-on-surface-variant text-xs ml-3">{formatTimestamp(req.createdAt)}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onBuyInAction(req.id, 'approve')}
                            disabled={requestActionLoading !== null}
                            className="px-3 py-1.5 bg-chip-green-dim border border-chip-green/35 chip-text-green hover:bg-chip-green/20 disabled:opacity-50 text-sm rounded-lg font-medium transition-colors duration-150"
                          >
                            {requestActionLoading === req.id + 'approve' ? '…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => onBuyInAction(req.id, 'reject')}
                            disabled={requestActionLoading !== null}
                            className="px-3 py-1.5 bg-chip-red-dim border border-chip-red/35 chip-text-red hover:bg-chip-red/20 disabled:opacity-50 text-sm rounded-lg font-medium transition-colors duration-150"
                          >
                            {requestActionLoading === req.id + 'reject' ? '…' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingCashOutRequests.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-warning uppercase tracking-wider mb-3">
                    Cash-Out Requests ({pendingCashOutRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingCashOutRequests.map((req: any) => (
                      <div key={req.id} className="bg-warning/8 border border-warning/25 rounded-xl px-4 py-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-on-surface">{req.user.name}</span>
                            <span className="text-warning ml-3 font-mono font-bold">${centsToUSD(req.amountCents)}</span>
                            <span className="text-on-surface-variant text-xs ml-3">{formatTimestamp(req.createdAt)}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => onCashOutAction(req.id, 'approve')}
                              disabled={requestActionLoading !== null}
                              className="px-3 py-1.5 bg-chip-green-dim border border-chip-green/35 chip-text-green hover:bg-chip-green/20 disabled:opacity-50 text-sm rounded-lg font-medium transition-colors duration-150"
                            >
                              {requestActionLoading === req.id + 'approve' ? '…' : 'Approve'}
                            </button>
                            <button
                              onClick={() => onCashOutAction(req.id, 'reject')}
                              disabled={requestActionLoading !== null}
                              className="px-3 py-1.5 bg-chip-red-dim border border-chip-red/35 chip-text-red hover:bg-chip-red/20 disabled:opacity-50 text-sm rounded-lg font-medium transition-colors duration-150"
                            >
                              {requestActionLoading === req.id + 'reject' ? '…' : 'Reject'}
                            </button>
                          </div>
                        </div>
                        {req.imageData && (
                          <img
                            src={req.imageData}
                            alt={`${req.user.name}'s chip stack`}
                            className="w-full max-h-48 object-contain rounded-xl bg-background"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalPending === 0 && <EmptyState message="No pending requests" />}
            </div>
          )}

          {/* ── Tab: Audit Log ── */}
          {activeTab === 'Audit Log' && (
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto">
              {room.events.length === 0 ? (
                <EmptyState message="No events yet" />
              ) : (
                [...room.events].reverse().map((event: any) => (
                  <div key={event.id} className="flex justify-between items-center bg-surface-raised rounded-xl px-4 py-2.5 text-sm">
                    <div>
                      <span className="font-medium text-on-surface">{event.user.name}</span>
                      <span className="text-on-surface-variant mx-2">
                        {event.type === 'BUY_IN' ? 'bought in' : event.type === 'REBUY' ? 'rebought' : 'cashed out'}
                      </span>
                      <span className={`font-bold font-mono ${event.type === 'CASH_OUT' ? 'chip-text-green' : 'text-on-surface'}`}>
                        ${centsToUSD(event.amount)}
                      </span>
                    </div>
                    <div className="text-on-surface-variant text-xs">{formatTimestamp(event.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
