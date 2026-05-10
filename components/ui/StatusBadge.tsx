const colorMap = {
  green: 'border-success text-success',
  blue: 'border-info text-info',
  slate: 'border-outline text-on-surface-variant',
  amber: 'border-warning text-warning',
  red: 'border-error text-error',
}

interface StatusBadgeProps {
  label: string
  color?: keyof typeof colorMap
}

export function StatusBadge({ label, color = 'slate' }: StatusBadgeProps) {
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${colorMap[color]}`}>
      {label}
    </span>
  )
}
