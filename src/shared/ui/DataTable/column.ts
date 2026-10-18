import type { ReactNode } from 'react'

/**
 * One table column: its header and how to render its cell for a row, defined together
 * so they can't get out of step.
 */
export type Column<Row> = {
  readonly key: string
  readonly header: ReactNode
  readonly cell: (row: Row) => ReactNode
  // Text starts at the start edge by default; short numbers can be centered or end-aligned
  readonly align?: 'start' | 'center' | 'end'
  // Marks the cell that names the row, so screen readers announce it with each cell
  readonly isRowHeader?: boolean
  // Keeps the column in view while the table scrolls sideways. Pinned columns come first,
  // and each one sets its own offset and width in `className`.
  readonly pinned?: boolean
  // Extra classes for every cell of the column, e.g. a pinned column's offset and width
  readonly className?: string
}
