export type TeamId = string

export type Team = {
  readonly id: TeamId
  readonly name: string
}

type MatchBase = {
  readonly id: string
  readonly homeTeamId: TeamId
  readonly awayTeamId: TeamId
}

// A match that has started has a score. A scheduled match has none: its scores are
// `null`, so they can't be used without checking the status first.
export type Match =
  | (MatchBase & {
      readonly status: 'completed' | 'live'
      readonly homeScore: number
      readonly awayScore: number
    })
  | (MatchBase & {
      readonly status: 'scheduled'
      readonly homeScore: null
      readonly awayScore: null
    })

export type CompetitionData = {
  readonly competition: {
    readonly id: string
    readonly name: string
  }
  readonly teams: readonly Team[]
  readonly matches: readonly Match[]
}
