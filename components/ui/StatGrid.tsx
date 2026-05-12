const colMap = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' } as const

interface Stat {
  label: string
  value: React.ReactNode
}

interface StatGridProps {
  stats: Stat[]
  columns?: keyof typeof colMap
}

export function StatGrid({ stats, columns = 2 }: StatGridProps) {
  return (
    <div className={`grid ${colMap[columns]} gap-3`}>
      {stats.map((stat, i) => (
        <div key={i} className="bg-surface border border-outline rounded-2xl p-4">
          <div className="text-on-surface-variant text-xs uppercase tracking-wide mb-1">{stat.label}</div>
          <div className="text-on-surface font-semibold tabular-nums">{stat.value}</div>
        </div>
      ))}
    </div>
  )
}
