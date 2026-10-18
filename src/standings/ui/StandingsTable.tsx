import { useMemo } from 'react'

import type { RowTone } from '@/shared/ui/DataTable/index.ts'
import type { CompetitionData } from '@/standings/model/competition.ts'
import type { TableRow } from '@/standings/ui/zones/withZones.ts'

import { DataTable } from '@/shared/ui/DataTable/index.ts'
import { StatusMessage } from '@/shared/ui/StatusMessage/index.ts'
import { calculateStandings } from '@/standings/model/calculateStandings.ts'
import { standingsColumns } from '@/standings/ui/columns/standingsColumns.tsx'
import { withZones } from '@/standings/ui/zones/withZones.ts'
import { ZoneLegend } from '@/standings/ui/zones/ZoneLegend.tsx'
import { ZONE_TONE } from '@/standings/ui/zones/zoneStyles.ts'

function teamIdOf(row: TableRow): string {
  return row.team.id
}

function zoneToneOf(row: TableRow): RowTone | undefined {
  return row.zone === null ? undefined : ZONE_TONE[row.zone]
}

export function StandingsTable({ competition }: { readonly competition: CompetitionData }) {
  // Derived from the loaded data, never stored, so it can't get out of step with it
  const rows = useMemo(() => withZones(calculateStandings(competition)), [competition])

  if (rows.length === 0) {
    return <StatusMessage kind="info" message="No teams in this competition yet." />
  }
  const completedCount = competition.matches.filter((match) => match.status === 'completed').length
  return (
    // Not a named section: the table's scroll region is already the landmark for it.
    // A flex column that may shrink, so the table gets the height that is left.
    <div className="flex min-h-0 flex-col">
      <h2 className="font-condensed text-2xl/tight font-bold tracking-wide uppercase">
        {competition.competition.name}
      </h2>
      <p className="mbe-4 text-sm text-muted">
        Standings after {completedCount} {completedCount === 1 ? 'match' : 'matches'}
      </p>
      <div className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line bg-surface">
        <DataTable
          caption={competition.competition.name}
          columns={standingsColumns}
          rows={rows}
          rowKey={teamIdOf}
          rowTone={zoneToneOf}
        />
        <ZoneLegend rows={rows} />
      </div>
    </div>
  )
}
