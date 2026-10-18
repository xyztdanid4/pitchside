import { useAsync } from '@/shared/lib/useAsync.ts'
import { fetchCompetition } from '@/standings/api/fetchCompetition.ts'

// `fetchCompetition` is module-level, so its identity is stable, as `useAsync` requires
export function useCompetition() {
  return useAsync(fetchCompetition)
}
