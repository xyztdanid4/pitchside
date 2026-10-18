import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Column } from '@/shared/ui/DataTable/index.ts'
import type { StandingRow } from '@/standings/model/calculateStandings.ts'

import { DataTable } from '@/shared/ui/DataTable/index.ts'
import { calculateStandings } from '@/standings/model/calculateStandings.ts'
import { expectNoAxeViolations } from '@/test/axe.ts'
import { PREMIER_DIVISION } from '@/test/premierDivision.ts'

// The real league table, shown with two of its columns
const ROWS = calculateStandings(PREMIER_DIVISION)

const COLUMNS: readonly Column<StandingRow>[] = [
  { key: 'club', header: 'Club', cell: (row) => row.team.name, isRowHeader: true },
  { key: 'points', header: 'Points', cell: (row) => row.points, align: 'end' },
]

function teamIdOf(row: StandingRow): string {
  return row.team.id
}

function renderTable() {
  return render(
    <DataTable caption="Premier Division" columns={COLUMNS} rows={ROWS} rowKey={teamIdOf} />,
  )
}

describe('DataTable', () => {
  it('is named by its caption', () => {
    renderTable()

    expect(screen.getByRole('table', { name: 'Premier Division' })).toBeInTheDocument()
  })

  it('renders a column header for each column, in order', () => {
    renderTable()

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent)
    expect(headers).toStrictEqual(['Club', 'Points'])
  })

  it('renders one row per item with the cells the columns define', () => {
    renderTable()

    // The first row is the header row
    const [, ...bodyRows] = screen.getAllByRole('row')
    expect(bodyRows.map((row) => row.textContent)).toStrictEqual([
      'Glenhaven City6',
      'Fairview FC5',
      'Ashford United4',
      'Dunwich Town4',
      'Bridgeford FC4',
      'Castle Athletic3',
      'Eastvale Rovers2',
      'Highmoor Athletic2',
    ])
  })

  it('marks the row header column so each cell is announced with it', () => {
    renderTable()

    const leaderRow = screen.getByRole('row', { name: /Glenhaven City/ })
    expect(within(leaderRow).getByRole('rowheader')).toHaveTextContent('Glenhaven City')
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderTable()

    await expectNoAxeViolations(container)
  })
})
