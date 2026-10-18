import { useId } from 'react'

import type { Column } from '@/shared/ui/DataTable/column.ts'

type DataTableProperties<Row> = {
  readonly caption: string
  readonly columns: readonly Column<Row>[]
  readonly rows: readonly Row[]
  readonly rowKey: (row: Row) => string
}

// A fixed row height keeps rows the same size whatever a cell contains
const CELL_CLASS = 'h-11 border-be border-foreground/15 px-3 whitespace-nowrap'

const ALIGN_CLASS = { start: 'text-start', center: 'text-center', end: 'text-end' } as const

function cellClassOf<Row>(column: Column<Row>): string {
  return `${CELL_CLASS} ${ALIGN_CLASS[column.align ?? 'start']}`
}

/**
 * A table that renders any list of rows. It knows nothing about the data itself:
 * the columns decide what each cell shows.
 *
 * The table scrolls inside its own region, so a wide table doesn't stretch the page.
 */
export function DataTable<Row>({ caption, columns, rows, rowKey }: DataTableProperties<Row>) {
  const captionId = useId()

  return (
    // Focusable, so keyboard users can scroll it; a named region, so screen readers
    // announce what it contains
    <div
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      // Scrolls vertically once its parent limits its height (`min-h-0` lets it shrink in
      // a flex column). `relative`: absolutely positioned content (the visually hidden
      // labels) is placed and clipped inside the region; otherwise it would stretch the
      // page sideways.
      className="relative min-h-0 overflow-auto"
    >
      {/* At least as wide as the region, wider when the columns need it */}
      <table className="w-max min-w-full border-collapse tabular-nums">
        {/* Names the table for screen readers; the page shows its own visible title */}
        <caption id={captionId} className="sr-only">
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={`${cellClassOf(column)} font-semibold`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) =>
                column.isRowHeader === true ? (
                  <th key={column.key} scope="row" className={`${cellClassOf(column)} font-normal`}>
                    {column.cell(row)}
                  </th>
                ) : (
                  <td key={column.key} className={cellClassOf(column)}>
                    {column.cell(row)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
