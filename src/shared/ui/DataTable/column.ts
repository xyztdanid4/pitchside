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
}
