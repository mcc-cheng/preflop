interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  fullWidth?: boolean
}

export function PrimaryButton({
  loading,
  loadingText = 'Loading...',
  fullWidth = true,
  children,
  className = '',
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={`${fullWidth ? 'w-full' : ''} h-11 px-6 bg-primary text-on-primary font-medium rounded-xl active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 ease-in-out ${className}`}
    >
      {loading ? loadingText : children}
    </button>
  )
}
