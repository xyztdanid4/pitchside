import { vi } from 'vitest'

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Replaces `fetch` for the current test. Each call gets the next of the given outcomes:
 * a `Response` resolves, an `Error` rejects (like a network failure).
 */
export function stubFetch(...outcomes: readonly (Error | Response)[]) {
  const fetchMock = vi.fn<typeof fetch>()
  for (const outcome of outcomes) {
    if (outcome instanceof Error) {
      fetchMock.mockRejectedValueOnce(outcome)
    } else {
      fetchMock.mockResolvedValueOnce(outcome)
    }
  }
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
