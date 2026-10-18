import { useMemo } from 'react'

import type { StandingRow } from '@/standings/model/calculateStandings.ts'
import type { CompetitionData } from '@/standings/model/competition.ts'

import { DataTable } from '@/shared/ui/DataTable/index.ts'
import { StatusMessage } from '@/shared/ui/StatusMessage/index.ts'
import { calculateStandings } from '@/standings/model/calculateStandings.ts'
import { standingsColumns } from '@/standings/ui/columns/standingsColumns.tsx'

function teamIdOf(row: StandingRow): string {
  return row.team.id
}

export function StandingsTable({ competition }: { readonly competition: CompetitionData }) {
  // Derived from the loaded data, never stored, so it can't get out of step with it
  const rows = useMemo(() => calculateStandings(competition), [competition])

  if (rows.length === 0) {
    return <StatusMessage kind="info" message="No teams in this competition yet." />
  }
  const completedCount = competition.matches.filter((match) => match.status === 'completed').length
  return (
    // Not a named section: the table's caption already names it
    <div>
      <h2 className="text-xl font-bold">{competition.competition.name}</h2>
      <p className="mbe-4 text-sm">
        Standings after {completedCount} {completedCount === 1 ? 'match' : 'matches'}
      </p>
      <DataTable
        caption={competition.competition.name}
        columns={standingsColumns}
        rows={rows}
        rowKey={teamIdOf}
      />
    </div>
  )
}
