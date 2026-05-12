interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  readyLabel?: string
}

export function ProgressBar({ value, max = 100, label, readyLabel }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100)
  const isReady = value >= max
  return (
    <div>
      {(label || readyLabel) && (
        <div className="flex justify-between text-xs text-on-surface-variant mb-1.5">
          {label && <span>{label}</span>}
          {readyLabel && isReady && <span className="text-success">{readyLabel}</span>}
        </div>
      )}
      <div className="w-full h-1 bg-outline rounded-full overflow-hidden">
        <div
          className="h-full bg-on-surface rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
