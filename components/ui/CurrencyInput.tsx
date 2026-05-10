interface ChipOption {
  color: string
  denomination: number // cents
}

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  chips?: ChipOption[]
  onChipAdd?: (dollars: number) => void
}

export function CurrencyInput({ className = '', chips, onChipAdd, ...props }: CurrencyInputProps) {
  return (
    <div>
      <div className={`relative flex items-center bg-surface border border-outline rounded-xl px-4 h-12 focus-within:border-chip-green/35 transition-all duration-150 ${className}`}>
        <span className="text-on-surface-variant text-sm pointer-events-none select-none mr-1">$</span>
        <input
          type="number"
          {...props}
          className="bg-transparent text-on-surface font-mono focus:outline-none w-full h-full tabular-nums"
        />
      </div>
      {chips && chips.length > 0 && onChipAdd && (
        <div className="flex overflow-x-auto gap-2 mt-2 pb-1">
          {[...chips].sort((a, b) => a.denomination - b.denomination).map((chip) => {
            const dollars = chip.denomination / 100
            const label = Number.isInteger(dollars) ? `+$${dollars}` : `+$${dollars.toFixed(2)}`
            return (
              <button
                key={chip.color}
                type="button"
                onClick={() => onChipAdd(dollars)}
                className="flex-shrink-0 rounded-full border border-outline px-3 py-1 text-xs text-on-surface-variant hover:border-chip-green/35 hover:text-chip-green-text hover:bg-chip-green-dim active:scale-95 transition-all duration-200 whitespace-nowrap cursor-pointer"
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
