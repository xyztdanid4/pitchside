import { useCallback, useEffect, useState } from 'react'

export type AsyncState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: unknown }
  | { readonly status: 'success'; readonly data: T }

/**
 * Runs an async `load` when the component mounts, and again on `retry`.
 *
 * Each run gets its own `AbortSignal`. A new run or unmounting aborts the previous one,
 * and its late result is dropped, so an old response can never overwrite a newer one.
 *
 * `load` must keep its identity between renders (a module-level function, or one from
 * `useCallback`): a new function on every render would start a new request every render.
 */
export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function run() {
      let next: AsyncState<T>
      try {
        next = { status: 'success', data: await load(controller.signal) }
      } catch (error: unknown) {
        next = { status: 'error', error }
      }
      // A run that was aborted was cancelled on purpose: its result, or the abort
      // error, is dropped instead of overwriting a newer run's state
      if (!controller.signal.aborted) {
        setState(next)
      }
    }

    void run()
    return () => {
      controller.abort()
    }
  }, [load, attempt])

  // Back to loading right away, in the event handler, so the old error disappears
  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((previous) => previous + 1)
  }, [])

  return { state, retry }
}
