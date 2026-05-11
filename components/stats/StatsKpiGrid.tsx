import type { UserStatsResult } from '@/lib/stats'

function fmt(cents: number) {
  const sign = cents >= 0 ? '' : '-'
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' }) {
  const valueClass =
    accent === 'green' ? 'chip-text-green' :
    accent === 'red' ? 'chip-text-red' :
    'text-on-surface'

  return (
    <div className="glass-card chip-border-white p-4 rounded-xl flex flex-col gap-1">
      <span className="text-xs text-on-surface-variant uppercase tracking-wide">{label}</span>
      <span className={`text-xl font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  )
}

export function StatsKpiGrid({ stats }: { stats: UserStatsResult }) {
  const pnlAccent = stats.lifetimePnlCents > 0 ? 'green' : stats.lifetimePnlCents < 0 ? 'red' : undefined

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <KpiCard label="Sessions" value={String(stats.sessionsPlayed)} />
      <KpiCard
        label="Lifetime P&L"
        value={fmt(stats.lifetimePnlCents)}
        accent={pnlAccent}
      />
      <KpiCard
        label="Win Rate"
        value={stats.sessionsPlayed > 0 ? `${Math.round(stats.winRate * 100)}%` : '—'}
        accent={stats.winRate >= 0.5 ? 'green' : stats.winRate > 0 ? 'red' : undefined}
      />
      <KpiCard
        label="Biggest Win"
        value={stats.biggestWinCents > 0 ? fmt(stats.biggestWinCents) : '—'}
        accent={stats.biggestWinCents > 0 ? 'green' : undefined}
      />
      <KpiCard
        label="Biggest Loss"
        value={stats.biggestLossCents < 0 ? fmt(stats.biggestLossCents) : '—'}
        accent={stats.biggestLossCents < 0 ? 'red' : undefined}
      />
      <KpiCard label="Total Buy-ins" value={fmt(stats.totalBuyInsCents)} />
    </div>
  )
}
