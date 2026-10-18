// @vitest-environment node

import fixture from '@public/data/premier-division.json'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { fetchJson } from '@/shared/lib/fetchJson.ts'
import { CompetitionSourceSchema } from '@/standings/api/competitionSchema.ts'
import { jsonResponse, stubFetch } from '@/test/fetch.ts'

const COMPETITION_URL = '/data/premier-division.json'

function fetchCompetitionData(signal = new AbortController().signal) {
  return fetchJson(COMPETITION_URL, CompetitionSourceSchema, signal)
}

describe('fetchJson', () => {
  it('returns the validated body', async () => {
    stubFetch(jsonResponse({ ...fixture, season: '2026/27' }))

    const data = await fetchCompetitionData()

    expect(data.competition.name).toBe('Premier Division')
    expect(data.teams).toHaveLength(8)
    // Validated, not just cast: properties the schema doesn't know are stripped
    expect(data).not.toHaveProperty('season')
  })

  it('passes the abort signal on to fetch', async () => {
    const fetchMock = stubFetch(jsonResponse(fixture))
    const controller = new AbortController()

    await fetchCompetitionData(controller.signal)

    expect(fetchMock).toHaveBeenCalledWith(COMPETITION_URL, { signal: controller.signal })
  })

  it('rejects on an HTTP error status', async () => {
    stubFetch(jsonResponse(fixture, 404))

    await expect(fetchCompetitionData()).rejects.toThrow(
      'Request to /data/premier-division.json failed with HTTP 404',
    )
  })

  it('rejects data of the wrong shape', async () => {
    stubFetch(jsonResponse({ ...fixture, teams: 'none' }))

    await expect(fetchCompetitionData()).rejects.toBeInstanceOf(z.ZodError)
  })

  it('rejects when the network fails', async () => {
    stubFetch(new TypeError('Failed to fetch'))

    await expect(fetchCompetitionData()).rejects.toThrow('Failed to fetch')
  })
})
