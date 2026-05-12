import { Avatar } from './Avatar'

interface SettlementRowProps {
  from: string
  to: string
  amount: number
}

export function SettlementRow({ from, to, amount }: SettlementRowProps) {
  const dollars = amount / 100
  const display = dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`

  return (
    <div className="glass-card chip-border-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <Avatar name={from} size="sm" />
          <span className="text-on-surface-variant text-xs mt-1">{from}</span>
        </div>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-chip-white opacity-40 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <div className="flex flex-col items-center">
          <Avatar name={to} size="sm" />
          <span className="text-on-surface-variant text-xs mt-1">{to}</span>
        </div>
      </div>
      <div className="font-mono font-bold chip-text-green text-lg tabular-nums">{display}</div>
    </div>
  )
}
