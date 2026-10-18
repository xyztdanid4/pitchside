// @vitest-environment node

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { CompetitionSourceSchema } from '@/standings/api/competitionSchema.ts'
import { arbitraryCompetition } from '@/test/arbitraryCompetition.ts'

describe('CompetitionSourceSchema, on any input', () => {
  // The schema must accept everything the domain types allow, and change nothing about
  // it: otherwise valid data from the source would be rejected or altered
  it('passes every valid season through unchanged', () => {
    fc.assert(
      fc.property(arbitraryCompetition, (competition) => {
        expect(CompetitionSourceSchema.parse(competition)).toStrictEqual({
          ...competition,
          skippedMatches: [],
        })
      }),
    )
  })

  // Bad input is reported as a failed result, never as an exception, so the fetch
  // layer always gets a clear validation error to show
  it('never throws, whatever JSON it gets', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        expect(() => CompetitionSourceSchema.safeParse(value)).not.toThrow()
      }),
    )
  })
})
