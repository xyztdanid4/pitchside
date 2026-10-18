// A highlight a row can have, e.g. for a good or a bad position in a table
export type RowTone = 'positive' | 'negative'

// Opaque backgrounds only: sticky cells take the row's background and must hide what
// scrolls under them. Callers pick a tone, not a class, so they can't break that.
export const ROW_TONE_CLASS: Readonly<Record<RowTone, string>> = {
  positive: 'bg-tone-positive',
  negative: 'bg-tone-negative',
}
