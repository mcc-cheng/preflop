import { Avatar } from './Avatar'

interface PlayerRowProps {
  name: string
  username?: string
  totalBuyIn: number
  totalCashOut: number
  net: number
  timeElapsed?: string
  isLive?: boolean
  status?: 'playing' | 'pending' | 'cashed-out'
}

function centsToDisplay(cents: number) {
  const abs = Math.abs(cents) / 100
  return abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2)
}

export function PlayerRow({
  name,
  username,
  net,
  timeElapsed,
  isLive,
  status = 'playing',
}: PlayerRowProps) {
  const netColor =
    net > 0 ? 'chip-text-green' : net < 0 ? 'chip-text-red' : 'text-on-surface-variant'
  const netDisplay = `${net >= 0 ? '+' : '-'}$${centsToDisplay(net)}`

  return (
    <div className="bg-surface border border-outline rounded-2xl p-4 flex justify-between items-center hover:bg-chip-green-dim transition-colors duration-200">
      <div className="flex items-center gap-3">
        <Avatar name={name} size="md" />
        <div>
          <div className="text-on-surface font-medium text-sm">{name}</div>
          {username && (
            <div className="text-on-surface-variant text-xs">@{username}</div>
          )}
          {timeElapsed && (
            <div className="text-on-surface-variant text-xs flex items-center gap-1">
              {timeElapsed}
              {isLive && <span className="text-chip-green-text text-[8px]">●</span>}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {status !== 'playing' && (
          <span className={`text-xs rounded-full px-2 py-0.5 border ${
            status === 'pending'
              ? 'border-warning text-warning'
              : 'border-outline text-on-surface-variant'
          }`}>
            {status === 'pending' ? 'Pending' : 'Cashed Out'}
          </span>
        )}
        <div className={`font-mono font-bold tabular-nums text-sm ${netColor}`}>
          {netDisplay}
        </div>
      </div>
    </div>
  )
}
