import type { Column } from '@/shared/ui/DataTable/index.ts'
import type { StandingRow } from '@/standings/model/calculateStandings.ts'

import { formatGoalDifference } from '@/standings/ui/columns/formatGoalDifference.ts'
import { numberColumn } from '@/standings/ui/columns/numberColumn.tsx'
import { ShortHeader } from '@/standings/ui/columns/ShortHeader.tsx'

// The columns of the league table, in the order of the mockup
export const standingsColumns: readonly Column<StandingRow>[] = [
  {
    key: 'position',
    header: <ShortHeader short="Pos" full="Position" />,
    cell: (row) => row.position,
  },
  {
    key: 'club',
    header: 'Club',
    cell: (row) => <span className="font-semibold">{row.team.name}</span>,
    isRowHeader: true,
  },
  numberColumn({ key: 'played', short: 'P', full: 'Matches played', value: (row) => row.played }),
  numberColumn({ key: 'won', short: 'W', full: 'Wins', value: (row) => row.won }),
  numberColumn({ key: 'drawn', short: 'D', full: 'Draws', value: (row) => row.drawn }),
  numberColumn({ key: 'lost', short: 'L', full: 'Losses', value: (row) => row.lost }),
  numberColumn({
    key: 'goalsFor',
    short: 'GF',
    full: 'Goals scored',
    value: (row) => row.goalsFor,
  }),
  numberColumn({
    key: 'goalsAgainst',
    short: 'GA',
    full: 'Goals against',
    value: (row) => row.goalsAgainst,
  }),
  numberColumn({
    key: 'goalDifference',
    short: 'GD',
    full: 'Goal difference',
    value: (row) => formatGoalDifference(row.goalDifference),
  }),
  {
    key: 'points',
    header: <ShortHeader short="Pts" full="Points" />,
    cell: (row) => <span className="font-bold">{row.points}</span>,
    align: 'center',
  },
]
