interface EmptyStateProps {
  message: string
  icon?: React.ReactNode
  subtitle?: string
}

export function EmptyState({ message, icon, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="text-chip-white opacity-20">{icon}</div>
      )}
      <p className="text-on-surface font-medium text-base mt-4">{message}</p>
      {subtitle && (
        <p className="text-on-surface-variant text-sm mt-1 max-w-[240px]">{subtitle}</p>
      )}
    </div>
  )
}
