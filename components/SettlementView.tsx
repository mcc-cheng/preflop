'use client'

import { useEffect, useState } from 'react'
import { centsToUSD } from '@/lib/utils'

interface Props {
  roomCode: string
  onClose: () => void
}

export default function SettlementView({ roomCode, onClose }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/rooms/${roomCode}/settlement`)
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
  }, [roomCode])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="text-white">Loading settlement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Settlement</h2>

        {/* Player Nets */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Final Positions</h3>
          <div className="space-y-2">
            {data.nets.map((net: any) => (
              <div key={net.userId} className="bg-slate-700 rounded p-3 flex justify-between">
                <span className="text-white">{net.user.name}</span>
                <span className={`font-bold ${net.netCents >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {net.netCents >= 0 ? '+' : ''}${centsToUSD(net.netCents)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Settlement Edges */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Required Transfers</h3>
          {data.edges.length === 0 ? (
            <div className="text-slate-400 text-center py-4">All settled! No transfers needed.</div>
          ) : (
            <div className="space-y-3">
              {data.edges.map((edge: any, i: number) => (
                <div key={i} className="bg-slate-700 rounded p-4">
                  <div className="text-white text-center">
                    <span className="font-semibold">{edge.fromUser.name}</span>
                    <span className="mx-3 text-slate-400">→</span>
                    <span className="font-semibold">{edge.toUser.name}</span>
                  </div>
                  <div className="text-center text-2xl font-bold text-green-400 mt-2">
                    ${centsToUSD(edge.amountCents)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  )
}
