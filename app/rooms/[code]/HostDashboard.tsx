'use client'

import { useState } from 'react'
import Link from 'next/link'
import { centsToUSD, formatTimestamp } from '@/lib/utils'
import type { RoomDashboardProps } from './types'

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

  const totalPending = pendingBuyInRequests.length + pendingCashOutRequests.length

  const tabs: Tab[] = ['Players', 'Requests', 'Audit Log']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link href="/rooms" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to rooms
        </Link>

        {/* Header */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-white">{settings.name}</h1>
                <span className="text-xs bg-blue-700 text-blue-100 px-2 py-0.5 rounded font-semibold">HOST</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-400 mt-1">
                <span>Code: <span className="font-mono text-white">{code}</span></span>
                {settings.blinds && <span>Blinds: <span className="text-white">{settings.blinds}</span></span>}
                {settings.maxPlayers && <span>Max: <span className="text-white">{settings.maxPlayers} players</span></span>}
                <span>Buy-in: <span className="text-white">${centsToUSD(settings.defaultBuyIn)}</span></span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onShowQR}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium"
              >
                QR Code
              </button>
              <button
                onClick={onShowSettlement}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium"
              >
                {room.endedAt ? 'View Settlement' : 'Preview Settlement'}
              </button>
              {!room.endedAt && (
                <button
                  onClick={onEndRoom}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                >
                  End Room
                </button>
              )}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total In</div>
              <div className="text-2xl font-bold text-green-400">${centsToUSD(totalBuyIns)}</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total Out</div>
              <div className="text-2xl font-bold text-red-400">${centsToUSD(totalCashOuts)}</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Table Balance</div>
              <div className="text-2xl font-bold text-white">${centsToUSD(tableBalance)}</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Players</div>
              <div className="text-2xl font-bold text-blue-400">{room.members.length}</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!room.endedAt && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => onOpenEvent('BUY_IN')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
            >
              + Buy In
            </button>
            <button
              onClick={() => onOpenEvent('REBUY')}
              className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium text-sm"
            >
              + Rebuy
            </button>
            <button
              onClick={() => onOpenEvent('CASH_OUT')}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm"
            >
              Cash Out
            </button>
          </div>
        )}

        {/* Tab bar */}
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <div className="flex border-b border-slate-700">
            {tabs.map((tab) => {
              const isActive = activeTab === tab
              const badge = tab === 'Requests' && totalPending > 0 ? totalPending : null
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors focus:outline-none ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                  {badge !== null && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'
                    }`}>
                      {badge}
                    </span>
                  )}
                  {/* Active underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />
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
                    <tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
                      <th className="text-left pb-3 pr-4">Player</th>
                      <th className="text-right pb-3 px-4">Bought In</th>
                      <th className="text-right pb-3 px-4">Cashed Out</th>
                      <th className="text-right pb-3 px-4">Net P&amp;L</th>
                      <th className="text-left pb-3 pl-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {playerStats.map((stat) => {
                      const isMe = stat.user.id === currentUserId
                      const lastEvent = room.events?.find((e: any) => e.userId === stat.user.id)
                      const hasCashedOut = lastEvent?.type === 'CASH_OUT'
                      return (
                        <tr key={stat.user.id} className={isMe ? 'bg-blue-900/10' : ''}>
                          <td className="py-3 pr-4">
                            <div className="font-medium text-white">
                              {stat.user.name}{' '}
                              {isMe && <span className="text-xs text-blue-400">(you)</span>}
                            </div>
                            <div className="text-slate-500 text-xs">@{stat.user.username}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-blue-300">
                            ${centsToUSD(stat.totalBuyIn)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            {stat.totalCashOut > 0 ? `$${centsToUSD(stat.totalCashOut)}` : '—'}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-bold ${stat.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stat.net >= 0 ? '+' : ''}${centsToUSD(stat.net)}
                          </td>
                          <td className="py-3 pl-4">
                            <div className="flex flex-col gap-1">
                              {(() => {
                                const pr = pendingBuyInRequests.find((r: any) => r.userId === stat.user.id)
                                return pr ? (
                                  <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">
                                    {pr.type === 'BUY_IN' ? 'Buy-in' : 'Rebuy'} pending
                                  </span>
                                ) : null
                              })()}
                              {stat.pendingRequest ? (
                                <span className="text-xs bg-amber-800 text-amber-300 px-2 py-0.5 rounded">
                                  Cash-out pending ${centsToUSD(stat.pendingRequest.amountCents)}
                                </span>
                              ) : hasCashedOut ? (
                                <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">Cashed Out</span>
                              ) : (
                                <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded">Playing</span>
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
                {/* Pending buy-in requests */}
                {pendingBuyInRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                      Buy-In Requests ({pendingBuyInRequests.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingBuyInRequests.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between bg-blue-900/30 border border-blue-800 rounded-lg px-4 py-3">
                          <div>
                            <span className="font-semibold text-white">{req.user.name}</span>
                            <span className="text-xs text-blue-300 ml-2 uppercase">{req.type === 'BUY_IN' ? 'Buy In' : 'Rebuy'}</span>
                            <span className="text-blue-200 ml-3 font-mono font-bold">${centsToUSD(req.amountCents)}</span>
                            <span className="text-slate-400 text-xs ml-3">{formatTimestamp(req.createdAt)}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => onBuyInAction(req.id, 'approve')}
                              disabled={requestActionLoading !== null}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
                            >
                              {requestActionLoading === req.id + 'approve' ? '…' : 'Approve'}
                            </button>
                            <button
                              onClick={() => onBuyInAction(req.id, 'reject')}
                              disabled={requestActionLoading !== null}
                              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
                            >
                              {requestActionLoading === req.id + 'reject' ? '…' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending cash-out requests */}
                {pendingCashOutRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
                      Cash-Out Requests ({pendingCashOutRequests.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingCashOutRequests.map((req: any) => (
                        <div key={req.id} className="bg-amber-900/30 border border-amber-800 rounded-lg px-4 py-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-white">{req.user.name}</span>
                              <span className="text-amber-300 ml-3 font-mono font-bold">${centsToUSD(req.amountCents)}</span>
                              <span className="text-slate-400 text-xs ml-3">{formatTimestamp(req.createdAt)}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => onCashOutAction(req.id, 'approve')}
                                disabled={requestActionLoading !== null}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
                              >
                                {requestActionLoading === req.id + 'approve' ? '…' : 'Approve'}
                              </button>
                              <button
                                onClick={() => onCashOutAction(req.id, 'reject')}
                                disabled={requestActionLoading !== null}
                                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
                              >
                                {requestActionLoading === req.id + 'reject' ? '…' : 'Reject'}
                              </button>
                            </div>
                          </div>
                          {req.imageData && (
                            <img
                              src={req.imageData}
                              alt={`${req.user.name}'s chip stack`}
                              className="w-full max-h-48 object-contain rounded-lg bg-slate-900"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {totalPending === 0 && (
                  <div className="text-slate-400 text-sm text-center py-12">
                    No pending requests
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Audit Log ── */}
            {activeTab === 'Audit Log' && (
              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {room.events.length === 0 ? (
                  <div className="text-slate-400 text-center py-12">No events yet</div>
                ) : (
                  [...room.events].reverse().map((event: any) => (
                    <div key={event.id} className="flex justify-between items-center bg-slate-700 rounded-lg px-4 py-2.5 text-sm">
                      <div>
                        <span className="font-medium text-white">{event.user.name}</span>
                        <span className="text-slate-400 mx-2">
                          {event.type === 'BUY_IN' ? 'bought in' : event.type === 'REBUY' ? 'rebought' : 'cashed out'}
                        </span>
                        <span className={`font-bold font-mono ${event.type === 'CASH_OUT' ? 'text-green-400' : 'text-blue-400'}`}>
                          ${centsToUSD(event.amount)}
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs">{formatTimestamp(event.createdAt)}</div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
