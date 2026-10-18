import { describe, expect, it } from 'vitest'

import { formatGoalDifference } from '@/standings/ui/columns/formatGoalDifference.ts'

describe('formatGoalDifference', () => {
  it.each([
    [2, '+2'],
    [0, '0'],
    [-1, '-1'],
  ])('formats %d as "%s"', (goalDifference, expected) => {
    expect(formatGoalDifference(goalDifference)).toBe(expected)
  })
})
