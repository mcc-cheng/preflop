interface SummaryPanelProps {
  net: number
  totalBuyIn: number
  totalCashOut: number
  duration?: string
  hourlyRate?: number | null
}

function cents(n: number) {
  const abs = Math.abs(n) / 100
  return abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2)
}

export function SummaryPanel({ net, totalBuyIn, totalCashOut, duration, hourlyRate }: SummaryPanelProps) {
  const netColor =
    net > 0 ? 'chip-text-green' : net < 0 ? 'chip-text-red' : 'text-on-surface-variant'
  const accentColor = net > 0 ? 'bg-chip-green' : net < 0 ? 'bg-chip-red' : 'bg-on-surface-variant'
  const netSign = net >= 0 ? '+' : '−'

  const subStats = [
    { label: 'Bought In',  value: `$${cents(totalBuyIn)}` },
    { label: 'Cashed Out', value: `$${cents(totalCashOut)}` },
    ...(duration ? [{ label: 'Duration', value: duration }] : []),
  ]

  return (
    <div className="glass-card chip-glow-green p-6">
      <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">Net</div>
      <div className={`font-mono font-bold text-6xl tabular-nums ${netColor}`}>
        {netSign}${cents(net)}
      </div>
      <div className={`w-6 h-0.5 rounded-full mt-2 ${accentColor}`} />

      <div className="border-t border-chip-white/10 my-4" />

      <div className="flex gap-6">
        {subStats.map((s) => (
          <div key={s.label}>
            <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-0.5">{s.label}</div>
            <div className="font-mono font-bold text-on-surface text-sm tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      {hourlyRate != null && (
        <div className="text-on-surface-variant text-sm mt-3 text-center">
          {hourlyRate >= 0 ? '+' : '−'}${Math.abs(hourlyRate).toFixed(2)}/hr
        </div>
      )}
    </div>
  )
}
