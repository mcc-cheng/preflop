interface DividerProps {
  label?: string
}

export function Divider({ label }: DividerProps) {
  if (!label) {
    return <div className="h-px bg-outline" />
  }
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-outline" />
      <span className="text-on-surface-variant text-sm">{label}</span>
      <div className="flex-1 h-px bg-outline" />
    </div>
  )
}
