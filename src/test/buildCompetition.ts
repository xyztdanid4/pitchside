import fixture from '@public/data/premier-division.json'

import type { CompetitionData, Match } from '@/standings/model/competition.ts'

type ScoreLine = `${number}-${number}`

type MatchSpec =
  | readonly [home: string, away: string, score: ScoreLine]
  | readonly [home: string, away: string, score: ScoreLine, status: 'completed' | 'live']
  | readonly [home: string, away: string, status: 'scheduled']

function toMatch(
  [home, away, scoreOrStatus, status = 'completed']: MatchSpec,
  index: number,
): Match {
  const base = { id: `m${String(index + 1)}`, homeTeamId: home, awayTeamId: away }
  if (scoreOrStatus === 'scheduled') {
    return { ...base, status: 'scheduled', homeScore: null, awayScore: null }
  }
  const [homeScore = 0, awayScore = 0] = scoreOrStatus.split('-').map(Number)
  return { ...base, status, homeScore, awayScore }
}

function fixtureTeam(id: string) {
  const team = fixture.teams.find((candidate) => candidate.id === id)
  if (team === undefined) {
    throw new Error(`No team "${id}" in the Premier Division fixture`)
  }
  return team
}

/**
 * Builds a Premier Division with some of its real clubs and made-up results, for tests
 * that need a specific situation:
 *
 *   buildCompetition(['ashford', 'bridgeford'], [['ashford', 'bridgeford', '2-0']])
 *
 * Clubs are taken from the fixture by id, with their real names. Matches are completed
 * unless a status is given, and get ids in order (m1, m2, ...).
 */
export function buildCompetition(
  teamIds: readonly string[],
  matches: readonly MatchSpec[],
): CompetitionData {
  return {
    competition: fixture.competition,
    teams: teamIds.map((id) => fixtureTeam(id)),
    matches: matches.map((spec, index) => toMatch(spec, index)),
  }
}
