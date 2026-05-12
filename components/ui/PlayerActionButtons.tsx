type PlayerState = 'NEVER_BOUGHT_IN' | 'BUY_IN_PENDING' | 'ACTIVE' | 'REBUY_PENDING' | 'CASH_OUT_PENDING' | 'CASHED_OUT'

interface PlayerActionButtonsProps {
  playerState: PlayerState
  onBuyIn: () => void
  onRebuy: () => void
  onCashOut: () => void
  roomEnded?: boolean
}

export function PlayerActionButtons({
  playerState,
  onBuyIn,
  onRebuy,
  onCashOut,
  roomEnded,
}: PlayerActionButtonsProps) {
  if (roomEnded) return null

  if (playerState === 'NEVER_BOUGHT_IN' || playerState === 'BUY_IN_PENDING' || playerState === 'CASHED_OUT') {
    const isPending = playerState === 'BUY_IN_PENDING'
    return (
      <button
        onClick={isPending ? undefined : onBuyIn}
        disabled={isPending}
        className="w-full h-11 bg-chip-white text-black font-medium rounded-xl active:scale-95 disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
      >
        {isPending ? 'Pending...' : 'Buy In'}
      </button>
    )
  }

  const isRebuyPending = playerState === 'REBUY_PENDING'
  const isCashOutPending = playerState === 'CASH_OUT_PENDING'

  return (
    <div className="flex gap-3">
      <button
        onClick={isRebuyPending ? undefined : onRebuy}
        disabled={isRebuyPending}
        className="flex-1 h-11 border border-chip-green/35 text-chip-green-text font-medium rounded-xl active:scale-95 disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed hover:bg-chip-green-dim transition-all duration-200 ease-in-out"
      >
        {isRebuyPending ? 'Pending...' : 'Rebuy'}
      </button>
      <button
        onClick={isCashOutPending ? undefined : onCashOut}
        disabled={isCashOutPending}
        className="flex-1 h-11 bg-chip-white text-black font-medium rounded-xl active:scale-95 disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
      >
        {isCashOutPending ? 'Pending...' : 'Cash Out'}
      </button>
    </div>
  )
}
