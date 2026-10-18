import type { Column } from '@/shared/ui/DataTable/index.ts'
import type { TableRow } from '@/standings/ui/zones/withZones.ts'

import { formatGoalDifference } from '@/standings/ui/columns/formatGoalDifference.ts'
import { numberColumn } from '@/standings/ui/columns/numberColumn.tsx'
import { ShortHeader } from '@/standings/ui/columns/ShortHeader.tsx'
import { ZONE_LABEL, ZONE_MARK_CLASS } from '@/standings/ui/zones/zoneStyles.ts'

// The columns of the league table, in the order of the mockup. Position and Club stay
// in view while the numbers scroll sideways.
export const standingsColumns: readonly Column<TableRow>[] = [
  {
    key: 'position',
    header: <ShortHeader short="Pos" full="Position" alwaysShort />,
    // The row tint and the dot show the zone; screen readers hear it with the position
    cell: (row) => (
      <span className="inline-flex items-center gap-1.5 font-condensed text-base font-semibold">
        <span
          aria-hidden="true"
          className={`size-1.5 rounded-full ${row.zone === null ? '' : ZONE_MARK_CLASS[row.zone]}`}
        />
        {row.position}
        {row.zone !== null && <span className="sr-only">, {ZONE_LABEL[row.zone]}</span>}
      </span>
    ),
    pinned: true,
    // A fixed width in rem, so it grows with the text size
    className: 'inset-s-0 w-14 min-w-14',
  },
  {
    key: 'club',
    header: 'Club',
    // A long name is cut off rather than pushing the numbers off a phone screen;
    // the full name stays in the text for screen readers and in the tooltip
    cell: (row) => (
      <span className="block truncate font-semibold" title={row.team.name}>
        {row.team.name}
      </span>
    ),
    isRowHeader: true,
    pinned: true,
    // Sticks where Position ends: its offset is Position's width (14)
    className: 'inset-s-14 w-44 min-w-44',
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
    // The column that decides the table stands out in the header bar too
    header: (
      <span className="font-bold text-on-head-strong">
        <ShortHeader short="Pts" full="Points" />
      </span>
    ),
    cell: (row) => <span className="font-condensed text-lg font-bold">{row.points}</span>,
    align: 'center',
  },
]
