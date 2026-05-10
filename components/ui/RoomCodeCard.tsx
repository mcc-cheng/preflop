import { StatPill } from './StatPill'

interface RoomCodeCardProps {
  code: string
  stats?: Array<{ label: string; value: string }>
}

export function RoomCodeCard({ code, stats }: RoomCodeCardProps) {
  return (
    <div className="glass-card chip-glow-green p-6">
      <div className="text-on-surface-variant text-xs uppercase tracking-widest mb-2">Room Code</div>
      <div className="font-mono font-bold text-5xl tracking-widest chip-text-white text-center py-2">
        {code}
      </div>
      {stats && stats.length > 0 && (
        <>
          <div className="border-b border-chip-white/10 my-4" />
          <div className="flex gap-2 flex-wrap justify-center">
            {stats.map((s) => (
              <StatPill key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
