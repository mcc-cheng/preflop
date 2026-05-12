interface ListItemCardProps {
  children: React.ReactNode
  className?: string
}

export function ListItemCard({ children, className = '' }: ListItemCardProps) {
  return (
    <div className={`flex items-center justify-between p-4 bg-surface border border-outline rounded-2xl ${className}`}>
      {children}
    </div>
  )
}
