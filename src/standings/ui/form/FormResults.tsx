import type { MatchResult } from '@/standings/model/calculateStandings.ts'

import { FORM_LENGTH } from '@/standings/model/calculateStandings.ts'
import { resultChip } from '@/standings/ui/form/resultChip.ts'

type FormResultsProperties = {
  // Oldest first, as the domain gives them
  readonly results: readonly MatchResult[]
}

const CHIP_CLASS =
  'grid h-4 min-w-5 place-items-center rounded-xs px-1 font-condensed text-[0.625rem] font-bold'

/**
 * Recent results as chips, the most recent first, like league tables show them.
 * Always FORM_LENGTH slots, so the column keeps its width; slots without a match yet
 * are empty placeholders. Screen readers hear "Win", not "W".
 */
export function FormResults({ results }: FormResultsProperties) {
  const newestFirst = results.toReversed()
  // `recency` 1 is the latest match: a stable identity for each slot
  const slots = Array.from({ length: FORM_LENGTH }, (_, index) => ({
    recency: index + 1,
    result: newestFirst[index],
  }))

  return (
    <ol aria-label="Most recent first" className="flex gap-1">
      {slots.map(({ recency, result }) =>
        result === undefined ? (
          <li key={recency} aria-hidden="true" className={`${CHIP_CLASS} border border-line`} />
        ) : (
          <li key={recency} className={`${CHIP_CLASS} ${resultChip(result).className}`}>
            <span aria-hidden="true">{result}</span>
            <span className="sr-only">{resultChip(result).label}</span>
          </li>
        ),
      )}
    </ol>
  )
}
