// @vitest-environment node

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import type { MatchResult, StandingRow } from '@/standings/model/calculateStandings.ts'
import type { CompetitionData, Match } from '@/standings/model/competition.ts'

import { calculateStandings, FORM_LENGTH } from '@/standings/model/calculateStandings.ts'
import { arbitraryCompetition } from '@/test/arbitraryCompetition.ts'

// Properties that hold for every season, whatever the results. fast-check generates
// many random seasons and, if one breaks a property, shrinks it to the smallest
// failing case.

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

type StartedMatch = Extract<Match, { status: 'completed' | 'live' }>

function completedMatches(competition: CompetitionData): StartedMatch[] {
  return competition.matches.filter((match): match is StartedMatch => match.status === 'completed')
}

// A team's results worked out directly from the matches, independently of the
// implementation, oldest first
function resultsOf(competition: CompetitionData, teamId: string): MatchResult[] {
  return completedMatches(competition)
    .filter((match) => match.homeTeamId === teamId || match.awayTeamId === teamId)
    .map((match) => {
      const side = match.homeTeamId === teamId ? 1 : -1
      const goalDifference = side * (match.homeScore - match.awayScore)
      if (goalDifference > 0) {
        return 'W'
      }
      return goalDifference === 0 ? 'D' : 'L'
    })
}

// True if `above` may be ranked directly above `below` under the ranking rules
function isRankedInOrder(above: StandingRow, below: StandingRow): boolean {
  if (above.points !== below.points) {
    return above.points > below.points
  }
  if (above.goalDifference !== below.goalDifference) {
    return above.goalDifference > below.goalDifference
  }
  return above.goalsFor === below.goalsFor
    ? above.team.name.localeCompare(below.team.name, 'en') <= 0
    : above.goalsFor > below.goalsFor
}

describe('calculateStandings, on any season', () => {
  it('lists every club exactly once, in positions 1 to n', () => {
    fc.assert(
      fc.property(arbitraryCompetition, (competition) => {
        const rows = calculateStandings(competition)

        expect(rows.map((row) => row.position)).toStrictEqual(
          competition.teams.map((_, index) => index + 1),
        )
        expect(rows.map((row) => row.team.id).toSorted()).toStrictEqual(
          competition.teams.map((team) => team.id).toSorted(),
        )
      }),
    )
  })

  it('keeps every row consistent with itself', () => {
    fc.assert(
      fc.property(arbitraryCompetition, (competition) => {
        for (const row of calculateStandings(competition)) {
          expect(row.played).toBe(row.won + row.drawn + row.lost)
          expect(row.points).toBe(3 * row.won + row.drawn)
          expect(row.goalDifference).toBe(row.goalsFor - row.goalsAgainst)
        }
      }),
    )
  })

  it('balances the league: goals, wins against losses, draws in pairs', () => {
    fc.assert(
      fc.property(arbitraryCompetition, (competition) => {
        const rows = calculateStandings(competition)
        const total = (pick: (row: StandingRow) => number) => sum(rows.map((row) => pick(row)))

        expect(total((row) => row.goalsFor)).toBe(total((row) => row.goalsAgainst))
        expect(total((row) => row.won)).toBe(total((row) => row.lost))
        expect(total((row) => row.drawn) % 2).toBe(0)
        // Only completed matches count, each one for both clubs
        expect(total((row) => row.played)).toBe(2 * completedMatches(competition).length)
      }),
    )
  })

  it('orders the rows by the ranking rules', () => {
    fc.assert(
      fc.property(arbitraryCompetition, (competition) => {
        const rows = calculateStandings(competition)
        const isInOrder = rows.slice(1).every((row, index) => {
          const above = rows[index]
          return above !== undefined && isRankedInOrder(above, row)
        })

        expect(isInOrder).toBe(true)
      }),
    )
  })

  it('shows the last results as form, oldest first', () => {
    fc.assert(
      fc.property(arbitraryCompetition, (competition) => {
        for (const row of calculateStandings(competition)) {
          expect(row.form).toStrictEqual(resultsOf(competition, row.team.id).slice(-FORM_LENGTH))
        }
      }),
    )
  })
})
