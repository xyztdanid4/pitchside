type ShortHeaderProperties = {
  readonly short: string
  readonly full: string
  // For a pinned column: its width is fixed, so the full name wouldn't fit there
  readonly alwaysShort?: boolean
}

/**
 * A short column label, or the full name when the table has room for it. Screen readers
 * always get the full name (`title` alone is not read reliably); mouse users see it on
 * hover.
 *
 * "Room" is a container query on the table's scroll region, not the screen width: with
 * full names the table needs about 66.6rem (measured), so they show from 68rem up. In
 * rem, so the threshold grows with the text size. The width doesn't depend on the data:
 * club names are cut off and the numbers have at most 3 characters.
 */
export function ShortHeader({ short, full, alwaysShort = false }: ShortHeaderProperties) {
  return (
    // No dotted underline: it clutters the header bar; the help cursor hints at the tooltip
    <abbr title={full} className="cursor-help no-underline">
      <span aria-hidden="true" className={alwaysShort ? undefined : '@min-[68rem]:hidden'}>
        {short}
      </span>
      <span className={alwaysShort ? 'sr-only' : 'sr-only @min-[68rem]:not-sr-only'}>{full}</span>
    </abbr>
  )
}
