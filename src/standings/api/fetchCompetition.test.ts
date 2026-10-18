// @vitest-environment node

import fixture from '@public/data/premier-division.json'
import { describe, expect, it, vi } from 'vitest'

import { fetchCompetition } from '@/standings/api/fetchCompetition.ts'
import { jsonResponse, stubFetch } from '@/test/fetch.ts'

// The fixture's scheduled match m14, but postponed: a status the app doesn't handle
const POSTPONED = { ...fixture.matches.at(-1), id: 'm15', status: 'postponed' }

describe('fetchCompetition', () => {
  it('loads the competition from the data file', async () => {
    const fetchMock = stubFetch(jsonResponse(fixture))

    const competition = await fetchCompetition(new AbortController().signal)

    expect(competition.competition.name).toBe('Premier Division')
    expect(fetchMock).toHaveBeenCalledWith('/data/premier-division.json', expect.anything())
  })

  it('leaves out a match with an unknown status and warns about it once', async () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue()
    stubFetch(jsonResponse({ ...fixture, matches: [...fixture.matches, POSTPONED] }))

    const competition = await fetchCompetition(new AbortController().signal)

    expect(competition.matches.map((match) => match.id)).not.toContain('m15')
    expect(competition).not.toHaveProperty('skippedMatches')
    expect(warn).toHaveBeenCalledExactlyOnceWith(expect.any(String), [
      { id: 'm15', status: 'postponed' },
    ])
  })

  it('does not warn when every match has a known status', async () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue()
    stubFetch(jsonResponse(fixture))

    await fetchCompetition(new AbortController().signal)

    expect(warn).not.toHaveBeenCalled()
  })
})
