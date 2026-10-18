import type { z } from 'zod'

/**
 * Fetches JSON and validates it against a schema. A network error, an HTTP error and
 * data of the wrong shape all reject, so the caller handles them in one place.
 */
export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with HTTP ${String(response.status)}`)
  }
  // `json()` is typed `any`; it's `unknown` until the schema has checked it
  const body: unknown = await response.json()
  return schema.parse(body)
}
