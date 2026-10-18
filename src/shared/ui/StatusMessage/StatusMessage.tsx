type StatusMessageProperties = {
  readonly kind: 'info' | 'error'
  readonly message: string
  // Shows a retry button when given
  readonly onRetry?: () => void
}

/**
 * A message in place of content that isn't there: still loading, failed, or empty.
 * Errors are announced right away (`alert`), anything else politely (`status`).
 */
export function StatusMessage({ kind, message, onRetry }: StatusMessageProperties) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className="py-4">
      <p>{message}</p>
      {onRetry !== undefined && (
        <button
          type="button"
          onClick={onRetry}
          className="mbs-2 rounded border border-foreground/30 px-3 py-1 font-semibold"
        >
          Try again
        </button>
      )}
    </div>
  )
}
