import fixture from '@public/data/premier-division.json'
import fc from 'fast-check'

import type { CompetitionData, Match } from '@/standings/model/competition.ts'

const STATUSES = ['completed', 'live', 'scheduled'] as const

/**
 * Random Premier Division seasons for property-based tests: 2 to 8 of the fixture's
 * real clubs, and up to 60 matches between them with any status and score. Match ids
 * are unique and no club plays itself, so every value is valid competition data.
 */
export const arbitraryCompetition: fc.Arbitrary<CompetitionData> = fc
  .shuffledSubarray(fixture.teams, { minLength: 2 })
  .chain((teams) => {
    const teamIds = teams.map((team) => team.id)
    const match = fc
      .record({
        homeTeamId: fc.constantFrom(...teamIds),
        awayTeamId: fc.constantFrom(...teamIds),
        status: fc.constantFrom(...STATUSES),
        homeScore: fc.nat(9),
        awayScore: fc.nat(9),
      })
      .filter((spec) => spec.homeTeamId !== spec.awayTeamId)

    return fc.array(match, { maxLength: 60 }).map((specs) => ({
      competition: fixture.competition,
      teams,
      matches: specs.map(({ status, homeScore, awayScore, ...teamsOfMatch }, index): Match => {
        const base = { id: `m${String(index + 1)}`, ...teamsOfMatch }
        return status === 'scheduled'
          ? { ...base, status, homeScore: null, awayScore: null }
          : { ...base, status, homeScore, awayScore }
      }),
    }))
  })
