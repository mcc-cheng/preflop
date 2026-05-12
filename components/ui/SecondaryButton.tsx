interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean
}

export function SecondaryButton({
  fullWidth = false,
  children,
  className = '',
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      {...props}
      className={`${fullWidth ? 'w-full' : ''} h-11 px-6 border border-outline text-on-surface font-medium rounded-xl active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 ease-in-out hover:bg-surface-raised ${className}`}
    >
      {children}
    </button>
  )
}
