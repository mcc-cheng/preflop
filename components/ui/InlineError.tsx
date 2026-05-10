interface InlineErrorProps {
  message?: string | null
}

export function InlineError({ message }: InlineErrorProps) {
  if (!message) return null
  return <div className="text-error text-sm">{message}</div>
}
