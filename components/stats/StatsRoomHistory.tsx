import type { UserStatsResult } from '@/lib/stats'

function fmt(cents: number) {
  const sign = cents >= 0 ? '' : '-'
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`
}

function formatDate(d: Date | null) {
  if (!d) return 'In progress'
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function StatsRoomHistory({ rooms }: { rooms: UserStatsResult['perRoomHistory'] }) {
  if (rooms.length === 0) {
    return <p className="text-on-surface-variant text-sm text-center py-4">No sessions yet</p>
  }

  return (
    <div className="space-y-2">
      {rooms.map(room => {
        const netAccent =
          room.netCents > 0 ? 'chip-text-green' :
          room.netCents < 0 ? 'chip-text-red' :
          'text-on-surface-variant'

        return (
          <div
            key={room.roomId}
            className="glass-card chip-border-white rounded-xl px-4 py-3 flex items-center justify-between"
          >
            <div>
              <div className="text-on-surface font-mono font-semibold text-sm tracking-widest">
                {room.roomCode}
              </div>
              <div className="text-on-surface-variant text-xs mt-0.5">{formatDate(room.endedAt)}</div>
            </div>
            <div className="text-right">
              <div className={`font-bold tabular-nums ${netAccent}`}>{fmt(room.netCents)}</div>
              <div className="text-on-surface-variant text-xs mt-0.5">
                in {fmt(room.buyInsCents)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
