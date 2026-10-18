// @vitest-environment node

import type { z } from 'zod'

import fixture from '@public/data/premier-division.json'
import { describe, expect, expectTypeOf, it } from 'vitest'

import type { CompetitionSource } from '@/standings/api/competitionSchema.ts'

import { CompetitionSourceSchema } from '@/standings/api/competitionSchema.ts'

const ASHFORD = { id: 'ashford', name: 'Ashford United' }
const BRIDGEFORD = { id: 'bridgeford', name: 'Bridgeford FC' }

// The fixture's first match, Ashford United 2–0 Bridgeford FC, with the given changes
function buildMatch(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 'm01',
    homeTeamId: 'ashford',
    awayTeamId: 'bridgeford',
    homeScore: 2,
    awayScore: 0,
    status: 'completed',
    ...overrides,
  }
}

// The Premier Division with two of its clubs and their first match, unless given others
function buildData(changes: { teams?: unknown[]; matches?: unknown[] } = {}) {
  return {
    competition: fixture.competition,
    teams: changes.teams ?? [ASHFORD, BRIDGEFORD],
    matches: changes.matches ?? [buildMatch({})],
  }
}

function issueMessages(data: unknown): string[] {
  const result = CompetitionSourceSchema.safeParse(data)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('CompetitionSourceSchema', () => {
  it('accepts the fixture data the app serves', () => {
    const result = CompetitionSourceSchema.safeParse(fixture)

    expect(result.success).toBe(true)
    expect(result.data?.teams).toHaveLength(8)
    expect(result.data?.matches).toHaveLength(14)
  })

  it('accepts completed, live and scheduled matches', () => {
    const data = buildData({
      matches: [
        buildMatch({ id: 'm01', status: 'completed' }),
        buildMatch({ id: 'm02', status: 'live' }),
        buildMatch({ id: 'm03', status: 'scheduled', homeScore: null, awayScore: null }),
      ],
    })

    expect(issueMessages(data)).toStrictEqual([])
  })

  it('strips unknown properties instead of rejecting them', () => {
    const data = { ...buildData(), season: '2026/27' }

    const result = CompetitionSourceSchema.safeParse(data)

    expect(result.success).toBe(true)
    expect(result.data).not.toHaveProperty('season')
  })

  describe('rejects a match', () => {
    it.each([
      ['that is scheduled but has a score', { status: 'scheduled', homeScore: 0, awayScore: 0 }],
      ['that is completed without a score', { homeScore: null }],
      ['that is live without a score', { status: 'live', awayScore: null }],
      ['with a negative score', { homeScore: -1 }],
      ['with a fractional score', { awayScore: 1.5 }],
      ['without an id', { id: '' }],
    ])('%s', (_description, overrides) => {
      const data = buildData({ matches: [buildMatch(overrides)] })

      expect(CompetitionSourceSchema.safeParse(data).success).toBe(false)
    })
  })

  describe('checks references between records', () => {
    it('rejects a match with an unknown team', () => {
      // Castle Athletic is a real club, but not one of the teams in this data
      const data = buildData({ matches: [buildMatch({ awayTeamId: 'castle-athletic' })] })

      expect(issueMessages(data)).toStrictEqual(['Unknown team "castle-athletic" in match "m01"'])
    })

    it('rejects a team playing itself', () => {
      const data = buildData({ matches: [buildMatch({ awayTeamId: 'ashford' })] })

      expect(issueMessages(data)).toStrictEqual([`Team "ashford" can't play itself in match "m01"`])
    })

    it('rejects duplicate team ids', () => {
      const data = buildData({
        teams: [ASHFORD, BRIDGEFORD, ASHFORD],
      })

      expect(issueMessages(data)).toStrictEqual(['Duplicate team id "ashford"'])
    })

    it('rejects duplicate match ids', () => {
      const data = buildData({ matches: [buildMatch({}), buildMatch({ homeScore: 2 })] })

      expect(issueMessages(data)).toStrictEqual(['Duplicate match id "m01"'])
    })
  })

  describe('a match with a status the app does not know', () => {
    it('is set aside instead of failing the whole table', () => {
      const postponed = buildMatch({ id: 'm02', status: 'postponed', homeScore: null })
      const data = buildData({ matches: [buildMatch({}), postponed] })

      const result = CompetitionSourceSchema.safeParse(data)

      expect(result.data?.matches.map((match) => match.id)).toStrictEqual(['m01'])
      expect(result.data?.skippedMatches).toStrictEqual([{ id: 'm02', status: 'postponed' }])
    })

    it('still fails when the status is missing or not a string', () => {
      for (const status of [undefined, 3]) {
        const data = buildData({ matches: [buildMatch({ status })] })
        expect(CompetitionSourceSchema.safeParse(data).success).toBe(false)
      }
    })

    it('still fails a match with a known status but invalid data', () => {
      const data = buildData({ matches: [buildMatch({ status: 'completed', homeScore: -1 })] })

      expect(CompetitionSourceSchema.safeParse(data).success).toBe(false)
    })
  })

  // Compile-time check: fails `pnpm typecheck`, not the test run. `satisfies` in the
  // schema only checks one direction; this checks that the two types are the same.
  // `.branded` compares deeply: the domain's `Match` is an intersection, zod's a flat object.
  it('produces exactly the hand-written domain type, plus the skipped matches', () => {
    expectTypeOf<
      z.output<typeof CompetitionSourceSchema>
    >().branded.toEqualTypeOf<CompetitionSource>()
  })
})
