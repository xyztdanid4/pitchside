import { z } from 'zod'

import type { CompetitionData, Match } from '@/standings/model/competition.ts'

/**
 * What the competition source sends, checked at runtime. `unknown` goes in, trusted
 * domain data comes out, so nothing past this point needs defensive checks.
 *
 * `satisfies` ties the schema to the hand-written domain types: if its output stops
 * matching, that's a compile error. `.readonly()` makes the output readonly like the
 * domain types, so they can be compared exactly in a type test.
 * Unknown properties are stripped rather than rejected, so new fields don't break the app.
 */

// A match left out because the app doesn't handle its status (e.g. "postponed")
export type SkippedMatch = { readonly id: string; readonly status: string }

// What the source gives: the competition, plus the matches it had to leave out
export type CompetitionSource = CompetitionData & {
  readonly skippedMatches: readonly SkippedMatch[]
}

// The one list of statuses the app handles: the schema below and the check for
// unknown statuses are both built from it, so they can't drift apart
const STARTED_STATUSES = ['completed', 'live'] as const
const SCHEDULED_STATUS = 'scheduled'
const KNOWN_STATUSES: ReadonlySet<string> = new Set([...STARTED_STATUSES, SCHEDULED_STATUS])

const TeamSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
  })
  .readonly()

const Score = z.number().int().nonnegative()

const matchBase = {
  id: z.string().min(1),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
}

const MatchSchema = z.discriminatedUnion('status', [
  z
    .object({
      ...matchBase,
      status: z.enum(STARTED_STATUSES),
      homeScore: Score,
      awayScore: Score,
    })
    .readonly(),
  z
    .object({
      ...matchBase,
      status: z.literal(SCHEDULED_STATUS),
      homeScore: z.null(),
      awayScore: z.null(),
    })
    .readonly(),
])

// A match with a status the app doesn't handle yet: one odd match shouldn't take the
// whole table down, so it's kept aside instead of failing. A match with a known status
// but invalid data still fails, because then the data itself is wrong.
const SkippedMatchSchema = z
  .object({
    id: z.string().min(1),
    status: z.string().refine((status) => !KNOWN_STATUSES.has(status)),
  })
  .readonly()

function isSkipped(entry: Match | SkippedMatch): entry is SkippedMatch {
  return !KNOWN_STATUSES.has(entry.status)
}

function isMatch(entry: Match | SkippedMatch): entry is Match {
  return !isSkipped(entry)
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value)
    }
    seen.add(value)
  }
  return [...duplicates]
}

export const CompetitionSourceSchema = z
  .object({
    competition: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
      })
      .readonly(),
    teams: z.array(TeamSchema).readonly(),
    matches: z.array(z.union([MatchSchema, SkippedMatchSchema])).readonly(),
  })
  // Rules that span several records: ids are unique, and every match refers to two
  // different teams that exist
  .superRefine((data, context) => {
    const duplicateTeamIds = findDuplicates(data.teams.map((team) => team.id))
    for (const id of duplicateTeamIds) {
      context.addIssue({ code: 'custom', path: ['teams'], message: `Duplicate team id "${id}"` })
    }
    const duplicateMatchIds = findDuplicates(data.matches.map((entry) => entry.id))
    for (const id of duplicateMatchIds) {
      context.addIssue({ code: 'custom', path: ['matches'], message: `Duplicate match id "${id}"` })
    }

    const teamIds = new Set(data.teams.map((team) => team.id))
    for (const [index, match] of data.matches.entries()) {
      // Skipped matches are left out of the table, so their teams aren't checked
      if (!isMatch(match)) {
        continue
      }
      for (const side of ['homeTeamId', 'awayTeamId'] as const) {
        if (!teamIds.has(match[side])) {
          context.addIssue({
            code: 'custom',
            path: ['matches', index, side],
            message: `Unknown team "${match[side]}" in match "${match.id}"`,
          })
        }
      }
      if (match.homeTeamId === match.awayTeamId) {
        context.addIssue({
          code: 'custom',
          path: ['matches', index],
          message: `Team "${match.homeTeamId}" can't play itself in match "${match.id}"`,
        })
      }
    }
  })
  // Splits the matches the app counts from the ones it left out
  .transform(({ matches, ...rest }): CompetitionSource => ({
    ...rest,
    matches: matches.filter((entry) => isMatch(entry)),
    skippedMatches: matches.filter((entry) => isSkipped(entry)),
  }))
  .readonly() satisfies z.ZodType<CompetitionSource>
