interface ChipDenominationRowProps {
  color: string
  denomination: string
  onChangeColor: (v: string) => void
  onChangeDenomination: (v: string) => void
  onDelete: () => void
  canDelete?: boolean
}

const inputClass = 'w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-on-surface focus:border-on-surface focus:outline-none transition-all duration-150 text-sm'

export function ChipDenominationRow({
  color,
  denomination,
  onChangeColor,
  onChangeDenomination,
  onDelete,
  canDelete = true,
}: ChipDenominationRowProps) {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
      <input
        type="text"
        value={color}
        onChange={(e) => onChangeColor(e.target.value)}
        placeholder="Color (e.g. White)"
        className={inputClass}
        required
      />
      <div className="relative flex items-center bg-surface border border-outline rounded-xl px-3 h-10 focus-within:border-on-surface transition-all duration-150">
        <span className="text-on-surface-variant text-sm pointer-events-none select-none mr-1">$</span>
        <input
          type="number"
          value={denomination}
          onChange={(e) => onChangeDenomination(e.target.value)}
          placeholder="0.25"
          step="0.01"
          min="0.01"
          className="bg-transparent text-on-surface font-mono focus:outline-none w-full text-sm tabular-nums"
          required
        />
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-chip-red-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
        aria-label="Remove chip"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
