// The app mark: a "P" drawn as a goal post and a ball
export function Logo() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-9 shrink-0">
      <rect width="64" height="64" rx="14" className="fill-brand" />
      <g className="fill-none stroke-surface" strokeWidth="5" strokeLinecap="round">
        <path d="M22 14 V50" />
        <circle cx="32" cy="24" r="10" />
      </g>
      <circle cx="32" cy="24" r="2.5" className="fill-surface" />
    </svg>
  )
}
