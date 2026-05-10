interface PageShellProps {
  children: React.ReactNode
  variant?: 'container' | 'centered'
}

export function PageShell({ children, variant = 'container' }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {variant === 'centered' ? (
        <div className="flex items-center justify-center min-h-screen px-4 pb-24">
          {children}
        </div>
      ) : (
        <div className="container mx-auto px-4 md:px-6 py-8 pb-24">
          {children}
        </div>
      )}
    </div>
  )
}
