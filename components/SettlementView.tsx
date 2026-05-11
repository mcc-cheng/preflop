'use client'

import { useEffect, useState } from 'react'
import { centsToUSD } from '@/lib/utils'
import { ModalShell, SecondaryButton } from '@/components/ui'

interface Props {
  roomCode: string
  onClose: () => void
}

export default function SettlementView({ roomCode, onClose }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/rooms/${roomCode}/settlement`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch settlement')
        return res.json()
      })
      .then(data => { setData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [roomCode])

  if (loading) {
    return (
      <ModalShell onClose={onClose}>
        <p className="text-on-surface-variant text-center py-10">Loading settlement…</p>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-xl font-bold text-on-surface mb-5">Settlement</h2>

      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Final Positions</p>
        <div className="space-y-1.5">
          {data.nets.map((net: any) => (
            <div key={net.userId} className="flex justify-between items-center px-3 py-2 rounded-xl bg-surface-raised">
              <span className="text-on-surface text-sm">{net.user.name}</span>
              <span className={`font-bold text-sm ${net.netCents >= 0 ? 'chip-text-green' : 'chip-text-red'}`}>
                {net.netCents >= 0 ? '+' : ''}${centsToUSD(net.netCents)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Required Transfers</p>
        {data.edges.length === 0 ? (
          <p className="text-on-surface-variant text-sm text-center py-4">All settled — no transfers needed.</p>
        ) : (
          <div className="space-y-2">
            {data.edges.map((edge: any, i: number) => (
              <div key={i} className="bg-surface-raised border border-outline rounded-xl px-4 py-3 text-center">
                <p className="text-on-surface text-sm">
                  <span className="font-semibold">{edge.fromUser.name}</span>
                  <span className="text-on-surface-variant mx-2">→</span>
                  <span className="font-semibold">{edge.toUser.name}</span>
                </p>
                <p className="chip-text-green font-bold text-2xl mt-1">${centsToUSD(edge.amountCents)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <SecondaryButton fullWidth onClick={onClose}>Close</SecondaryButton>
    </ModalShell>
  )
}
