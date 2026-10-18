import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { CompetitionData } from '@/standings/model/competition.ts'

import { useAsync } from '@/shared/lib/useAsync.ts'
import { PREMIER_DIVISION } from '@/test/premierDivision.ts'

// What the app loads: the Premier Division
const COMPETITION = PREMIER_DIVISION
// An earlier response for the same competition, from before the last round of matches
const EARLIER_COMPETITION = { ...COMPETITION, matches: COMPETITION.matches.slice(0, 8) }
const NETWORK_ERROR = new TypeError('Failed to fetch')

// A load whose result the test decides, and when
function controllableLoad() {
  const signals: AbortSignal[] = []
  const settlers: {
    resolve: (value: CompetitionData) => void
    reject: (error: Error) => void
  }[] = []
  const load = vi.fn(
    (signal: AbortSignal) =>
      new Promise<CompetitionData>((resolve, reject) => {
        signals.push(signal)
        settlers.push({ resolve, reject })
      }),
  )
  return { load, signals, settlers }
}

describe('useAsync', () => {
  it('starts loading and then holds the loaded data', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve(COMPETITION)))

    expect(result.current.state).toStrictEqual({ status: 'loading' })
    await waitFor(() => {
      expect(result.current.state).toStrictEqual({ status: 'success', data: COMPETITION })
    })
  })

  it('holds the error when the load fails', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.reject(NETWORK_ERROR)))

    await waitFor(() => {
      expect(result.current.state).toStrictEqual({ status: 'error', error: NETWORK_ERROR })
    })
  })

  it('loads again on retry, showing loading in between', async () => {
    const { load, settlers } = controllableLoad()
    const { result } = renderHook(() => useAsync(load))
    await act(async () => {
      settlers[0]?.reject(NETWORK_ERROR)
      await Promise.resolve()
    })
    expect(result.current.state.status).toBe('error')

    act(() => {
      result.current.retry()
    })

    expect(result.current.state).toStrictEqual({ status: 'loading' })
    await act(async () => {
      settlers[1]?.resolve(COMPETITION)
      await Promise.resolve()
    })
    expect(result.current.state).toStrictEqual({ status: 'success', data: COMPETITION })
  })

  it('aborts the previous load on retry and ignores its late result', async () => {
    const { load, signals, settlers } = controllableLoad()
    const { result } = renderHook(() => useAsync(load))

    act(() => {
      result.current.retry()
    })
    expect(signals[0]?.aborted).toBe(true)

    await act(async () => {
      settlers[1]?.resolve(COMPETITION)
      settlers[0]?.resolve(EARLIER_COMPETITION)
      await Promise.resolve()
    })
    expect(result.current.state).toStrictEqual({ status: 'success', data: COMPETITION })
  })

  it('aborts the load on unmount', () => {
    const { load, signals } = controllableLoad()
    const { unmount } = renderHook(() => useAsync(load))

    unmount()

    expect(signals[0]?.aborted).toBe(true)
  })
})
