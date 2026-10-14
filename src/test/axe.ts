import type { Result, RunOptions } from 'axe-core'

import axe from 'axe-core'
import { expect } from 'vitest'

const RUN_OPTIONS: RunOptions = {
  rules: {
    // jsdom doesn't compute styles or layout, so contrast can't be measured here
    'color-contrast': { enabled: false },
  },
}

function formatViolations(violations: Result[]): string {
  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ')
      return `[${violation.id}] ${violation.help} (${targets})\n  ${violation.helpUrl}`
    })
    .join('\n')
}

/**
 * Runs axe-core on a rendered container and fails the test with a readable list
 * of accessibility violations, if there are any.
 */
export async function expectNoAxeViolations(container: Element): Promise<void> {
  const { violations } = await axe.run(container, RUN_OPTIONS)
  expect(violations, formatViolations(violations)).toStrictEqual([])
}
