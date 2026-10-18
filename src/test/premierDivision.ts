import fixture from '@public/data/premier-division.json'

import type { CompetitionData } from '@/standings/model/competition.ts'

import { CompetitionSourceSchema } from '@/standings/api/competitionSchema.ts'

function validatedFixture(): CompetitionData {
  const { skippedMatches, ...competition } = CompetitionSourceSchema.parse(fixture)
  // Tests rely on every fixture match being counted, so a skipped one is an error here
  if (skippedMatches.length > 0) {
    throw new Error(
      `The fixture has matches with unknown statuses: ${JSON.stringify(skippedMatches)}`,
    )
  }
  return competition
}

/**
 * The Premier Division fixture, validated by the same schema the app uses, so tests
 * work with real, checked data rather than a type assertion.
 */
export const PREMIER_DIVISION = validatedFixture()
