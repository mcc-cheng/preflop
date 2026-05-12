const paddingMap = { sm: 'p-4 md:p-5', md: 'p-5 md:p-6', lg: 'p-5 md:p-6' }

interface CardProps {
  children: React.ReactNode
  padding?: keyof typeof paddingMap
  className?: string
}

export function Card({ children, padding = 'md', className = '' }: CardProps) {
  return (
    <div className={`bg-surface border border-outline rounded-2xl ${paddingMap[padding]} ${className}`}>
      {children}
    </div>
  )
}
