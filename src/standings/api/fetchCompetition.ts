import type { CompetitionData } from '@/standings/model/competition.ts'

import { fetchJson } from '@/shared/lib/fetchJson.ts'
import { CompetitionSourceSchema } from '@/standings/api/competitionSchema.ts'

// Relative to the base URL, so the app also works when deployed under a sub-path
const COMPETITION_URL = `${import.meta.env.BASE_URL}data/premier-division.json`

export async function fetchCompetition(signal: AbortSignal): Promise<CompetitionData> {
  const { skippedMatches, ...competition } = await fetchJson(
    COMPETITION_URL,
    CompetitionSourceSchema,
    signal,
  )
  if (skippedMatches.length > 0) {
    // The schema stays pure and returns the skipped matches as data; this is the I/O
    // boundary, so the warning goes here
    // eslint-disable-next-line no-console -- the only sign that the source sends a status the app ignores
    console.warn('Skipped matches with a status the app does not handle:', skippedMatches)
  }
  return competition
}
