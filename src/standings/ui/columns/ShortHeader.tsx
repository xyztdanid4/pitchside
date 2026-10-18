type ShortHeaderProperties = {
  readonly short: string
  readonly full: string
}

/**
 * A short column label, with its full name for everyone who needs it: screen readers
 * always get the full name (`title` alone is not read reliably); mouse users see it on
 * hover.
 */
export function ShortHeader({ short, full }: ShortHeaderProperties) {
  return (
    // No dotted underline: it clutters the header; the help cursor hints at the tooltip
    <abbr title={full} className="cursor-help no-underline">
      <span aria-hidden="true">{short}</span>
      <span className="sr-only">{full}</span>
    </abbr>
  )
}
