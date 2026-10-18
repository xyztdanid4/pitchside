import type { CompetitionData, Match, Team, TeamId } from '@/standings/model/competition.ts'

const POINTS_FOR_WIN = 3
const POINTS_FOR_DRAW = 1
export const FORM_LENGTH = 5

export type MatchResult = 'W' | 'D' | 'L'

// A team's numbers before the table is ranked
type TeamStats = {
  readonly team: Team
  readonly played: number
  readonly won: number
  readonly drawn: number
  readonly lost: number
  readonly goalsFor: number
  readonly goalsAgainst: number
  readonly goalDifference: number
  readonly points: number
  /**
   * Up to the last FORM_LENGTH results, oldest first
   */
  readonly form: readonly MatchResult[]
}

// The position only exists after ranking, so the ranking rules can't depend on it
export type StandingRow = TeamStats & { readonly position: number }

// Running totals while the matches are processed. Games played, wins, draws and
// losses are not stored: they are derived from `results` at the end, so they can't
// get out of step with it.
type RunningTotals = {
  readonly goalsFor: number
  readonly goalsAgainst: number
  readonly results: readonly MatchResult[]
}

const EMPTY_TOTALS: RunningTotals = { goalsFor: 0, goalsAgainst: 0, results: [] }

type FinishedMatch = Extract<Match, { status: 'completed' }>

// Only finished matches change the table: a live score can still change, and a
// scheduled match has no score at all
function isFinished(match: Match): match is FinishedMatch {
  return match.status === 'completed'
}

function resultFor(scored: number, conceded: number): MatchResult {
  if (scored > conceded) {
    return 'W'
  }
  return scored === conceded ? 'D' : 'L'
}

// Returns new totals; the previous ones are left unchanged
function withResult(totals: RunningTotals, scored: number, conceded: number): RunningTotals {
  return {
    goalsFor: totals.goalsFor + scored,
    goalsAgainst: totals.goalsAgainst + conceded,
    results: [...totals.results, resultFor(scored, conceded)],
  }
}

function countOf(results: readonly MatchResult[], wanted: MatchResult): number {
  return results.filter((result) => result === wanted).length
}

function toTeamStats(team: Team, { goalsFor, goalsAgainst, results }: RunningTotals): TeamStats {
  const won = countOf(results, 'W')
  const drawn = countOf(results, 'D')
  return {
    team,
    played: results.length,
    won,
    drawn,
    lost: countOf(results, 'L'),
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points: won * POINTS_FOR_WIN + drawn * POINTS_FOR_DRAW,
    form: results.slice(-FORM_LENGTH),
  }
}

// Created once and reused: a collator is the standard way to compare strings for sorting.
// The explicit 'en' locale keeps the name order identical on every machine.
const compareNames = new Intl.Collator('en').compare

// The ranking rules, in order. The first rule that tells two teams apart decides.
const RANKING_RULES: readonly ((a: TeamStats, b: TeamStats) => number)[] = [
  (a, b) => b.points - a.points,
  (a, b) => b.goalDifference - a.goalDifference,
  (a, b) => b.goalsFor - a.goalsFor,
  (a, b) => compareNames(a.team.name, b.team.name),
]

function compareRows(a: TeamStats, b: TeamStats): number {
  for (const rule of RANKING_RULES) {
    const difference = rule(a, b)
    if (difference !== 0) {
      return difference
    }
  }
  return 0
}

/**
 * Calculates the league table from the teams and match results.
 * A pure function: same input, same output, no side effects.
 */
export function calculateStandings({
  teams,
  matches,
}: Pick<CompetitionData, 'matches' | 'teams'>): readonly StandingRow[] {
  const totalsByTeam = new Map<TeamId, RunningTotals>(teams.map((team) => [team.id, EMPTY_TOTALS]))

  const totalsFor = (teamId: TeamId): RunningTotals => {
    const totals = totalsByTeam.get(teamId)
    if (totals === undefined) {
      // The schema guarantees that every match refers to a known team
      throw new Error(`Match refers to unknown team "${teamId}"`)
    }
    return totals
  }

  // Matches are processed in array order, which is taken to be the order they were played
  // in: the data has no dates. This order decides the order of each team's form.
  for (const match of matches) {
    if (!isFinished(match)) {
      continue
    }
    const { homeTeamId, awayTeamId, homeScore, awayScore } = match
    totalsByTeam.set(homeTeamId, withResult(totalsFor(homeTeamId), homeScore, awayScore))
    totalsByTeam.set(awayTeamId, withResult(totalsFor(awayTeamId), awayScore, homeScore))
  }

  return teams
    .map((team) => toTeamStats(team, totalsFor(team.id)))
    .toSorted(compareRows)
    .map((stats, index) => ({ position: index + 1, ...stats }))
}
