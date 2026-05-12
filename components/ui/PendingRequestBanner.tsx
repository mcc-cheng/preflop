interface PendingRequestBannerProps {
  message: string
  onReview?: () => void
}

export function PendingRequestBanner({ message, onReview }: PendingRequestBannerProps) {
  return (
    <div className="glass-card chip-border-purple chip-glow-purple p-4 flex items-center justify-between animate-slide-in-top">
      <div className="flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
        <p className="text-warning font-medium text-sm">{message}</p>
      </div>
      {onReview && (
        <button
          onClick={onReview}
          className="chip-text-purple hover:text-chip-white text-sm font-medium ml-4 flex-shrink-0 underline-offset-2 hover:underline transition-colors duration-200"
        >
          Review
        </button>
      )}
    </div>
  )
}
