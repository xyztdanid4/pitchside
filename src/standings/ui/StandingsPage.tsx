import { StatusMessage } from '@/shared/ui/StatusMessage/index.ts'
import { useCompetition } from '@/standings/api/useCompetition.ts'
import { StandingsTable } from '@/standings/ui/StandingsTable.tsx'

export function StandingsPage() {
  const { state, retry } = useCompetition()

  switch (state.status) {
    case 'loading': {
      return <StatusMessage kind="info" message="Loading the table…" />
    }
    case 'error': {
      return <StatusMessage kind="error" message="The table couldn't be loaded." onRetry={retry} />
    }
    case 'success': {
      return <StandingsTable competition={state.data} />
    }
  }
}
