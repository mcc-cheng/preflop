type TransactionType = 'BUY_IN' | 'REBUY' | 'CASH_OUT' | 'PENDING_BUY_IN' | 'PENDING_REBUY' | 'PENDING_CASH_OUT'

interface TransactionRowProps {
  type: TransactionType
  amount: number
  timestamp?: string
  runningBalance?: number
}

function centsToDisplay(cents: number) {
  const abs = Math.abs(cents) / 100
  return abs % 1 === 0 ? `$${abs.toFixed(0)}` : `$${abs.toFixed(2)}`
}

const TYPE_META: Record<TransactionType, { label: string; color: string; pending: boolean }> = {
  BUY_IN:           { label: 'Buy In',   color: 'text-on-surface',    pending: false },
  REBUY:            { label: 'Rebuy',    color: 'chip-text-purple',   pending: false },
  CASH_OUT:         { label: 'Cash Out', color: 'chip-text-green',    pending: false },
  PENDING_BUY_IN:   { label: 'Buy In',   color: 'text-warning',       pending: true  },
  PENDING_REBUY:    { label: 'Rebuy',    color: 'text-warning',       pending: true  },
  PENDING_CASH_OUT: { label: 'Cash Out', color: 'text-warning',       pending: true  },
}

function TypeIcon({ type, className }: { type: TransactionType; className?: string }) {
  const base = type.replace('PENDING_', '') as 'BUY_IN' | 'REBUY' | 'CASH_OUT'
  if (base === 'BUY_IN') {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4" />
      </svg>
    )
  }
  if (base === 'REBUY') {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4m0 0l4 4m-4-4l-4 4" />
    </svg>
  )
}

export function TransactionRow({ type, amount, timestamp, runningBalance }: TransactionRowProps) {
  const meta = TYPE_META[type]
  const balColor =
    (runningBalance ?? 0) > 0 ? 'chip-text-green' :
    (runningBalance ?? 0) < 0 ? 'chip-text-red' :
    'text-on-surface-variant'

  return (
    <div className="flex justify-between items-center py-3 border-b border-outline last:border-0">
      <div className="flex items-center gap-3">
        <TypeIcon type={type} className={meta.color} />
        <div className={`text-sm font-medium flex items-center gap-2 ${meta.pending ? 'italic' : ''} ${meta.color}`}>
          {meta.label}
          {meta.pending && (
            <span className="text-xs bg-chip-purple-dim chip-text-purple border border-chip-purple/35 rounded-full px-2 py-0.5 not-italic">
              Pending
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono font-bold tabular-nums text-sm text-on-surface">
          {centsToDisplay(amount)}
        </div>
        {timestamp && (
          <div className="text-xs text-on-surface-variant mt-0.5">{timestamp}</div>
        )}
        {runningBalance !== undefined && (
          <div className={`font-mono text-xs tabular-nums ${balColor}`}>
            {(runningBalance >= 0 ? '+' : '')}${(Math.abs(runningBalance) / 100).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  )
}
