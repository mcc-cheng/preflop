interface ModalShellProps {
  children: React.ReactNode
  onClose?: () => void
  maxWidth?: string
}

export function ModalShell({ children, onClose, maxWidth = 'max-w-md' }: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
      onClick={onClose}
    >
      <div
        className={`bg-surface border border-outline rounded-t-2xl sm:rounded-2xl p-6 ${maxWidth} w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
