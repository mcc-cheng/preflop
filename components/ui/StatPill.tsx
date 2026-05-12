interface StatPillProps {
  label: string
  value: string
}

export function StatPill({ label, value }: StatPillProps) {
  return (
    <div className="bg-surface-raised rounded-full px-3 py-1 inline-flex items-center gap-1 border border-transparent hover:border-chip-green/35 hover:bg-chip-green-dim hover:text-chip-green-text transition-colors duration-200 cursor-default">
      <span className="text-xs text-on-surface-variant uppercase tracking-wide">{label}</span>
      <span className="text-xs text-on-surface font-medium">{value}</span>
    </div>
  )
}
