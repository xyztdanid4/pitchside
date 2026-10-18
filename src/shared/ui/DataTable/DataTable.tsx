import { useId } from 'react'

import type { Column } from '@/shared/ui/DataTable/column.ts'
import type { RowTone } from '@/shared/ui/DataTable/rowTone.ts'

import { ROW_TONE_CLASS } from '@/shared/ui/DataTable/rowTone.ts'

type DataTableProperties<Row> = {
  readonly caption: string
  readonly columns: readonly Column<Row>[]
  readonly rows: readonly Row[]
  readonly rowKey: (row: Row) => string
  // Highlights a row; rows without a tone get the plain surface
  readonly rowTone?: (row: Row) => RowTone | undefined
}

function rowBackground(tone: RowTone | undefined): string {
  return tone === undefined ? 'bg-surface' : ROW_TONE_CLASS[tone]
}

// The bottom border sits on the cells: rows can't have borders in the separate border model.
// A fixed row height keeps rows the same size whatever a cell contains.
const CELL_CLASS = 'h-11 border-be border-line px-3 whitespace-nowrap'

const ALIGN_CLASS = { start: 'text-start', center: 'text-center', end: 'text-end' } as const

// The classes every cell of a column shares
function cellClassOf<Row>(column: Column<Row>): string {
  const base = `${CELL_CLASS} ${ALIGN_CLASS[column.align ?? 'start']}`
  return column.className === undefined ? base : `${base} ${column.className}`
}

/**
 * A table that renders any list of rows. It knows nothing about the data itself:
 * the columns decide what each cell shows.
 *
 * The table scrolls inside its own region: the header row stays at the top and
 * pinned columns stay at the start while the rest moves.
 */
export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  rowTone,
}: DataTableProperties<Row>) {
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
      // page sideways. `@container`: cells can adapt to the table's width (container
      // queries), whatever the screen size.
      className="@container relative min-h-0 overflow-auto"
    >
      {/* `border-separate`: with collapsed borders, sticky cells leave their borders behind.
          At least as wide as the region, wider when the columns need it. */}
      <table className="w-max min-w-full border-separate border-spacing-0 tabular-nums">
        {/* Names the table for screen readers; the page shows its own visible title */}
        <caption id={captionId} className="sr-only">
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                // An opaque bar, so content scrolling under it is hidden. Pinned header
                // cells stick in both directions, so they go above all others.
                className={`${cellClassOf(column)} sticky inset-bs-0 bg-head font-condensed text-sm font-semibold tracking-wider text-on-head uppercase ${column.pinned === true ? 'z-3' : 'z-2'}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={rowBackground(rowTone?.(row))}>
              {columns.map((column) => {
                // Cells take the row's opaque background. Pinned cells stick, above the
                // cells that scroll under them.
                const cellClass =
                  column.pinned === true
                    ? `${cellClassOf(column)} sticky z-1 bg-inherit`
                    : `${cellClassOf(column)} bg-inherit`
                return column.isRowHeader === true ? (
                  <th key={column.key} scope="row" className={`${cellClass} font-normal`}>
                    {column.cell(row)}
                  </th>
                ) : (
                  <td key={column.key} className={cellClass}>
                    {column.cell(row)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
