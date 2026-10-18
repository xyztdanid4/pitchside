import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FormResults } from '@/standings/ui/form/FormResults.tsx'
import { expectNoAxeViolations } from '@/test/axe.ts'

// What a screen reader hears for each chip, in order
function spokenResults(): (string | null)[] {
  return within(screen.getByRole('list', { name: 'Most recent first' }))
    .getAllByRole('listitem')
    .map((item) => within(item).getByText(/^(Win|Draw|Loss)$/).textContent)
}

describe('FormResults', () => {
  // The domain gives results oldest first; flipping that is an easy mistake to make
  it('shows the most recent result first', () => {
    render(<FormResults results={['W', 'D', 'L']} />)

    expect(spokenResults()).toStrictEqual(['Loss', 'Draw', 'Win'])
  })

  it('shows letters on screen but full words to screen readers', () => {
    render(<FormResults results={['W']} />)

    const chip = screen.getByRole('listitem')
    expect(within(chip).getByText('W')).toHaveAttribute('aria-hidden', 'true')
    expect(within(chip).getByText('Win')).toBeInTheDocument()
  })

  it('always has five slots, keeping empty ones out of the accessibility tree', () => {
    render(<FormResults results={['W', 'D']} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getAllByRole('listitem', { hidden: true })).toHaveLength(5)
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<FormResults results={['W', 'D', 'L']} />)

    await expectNoAxeViolations(container)
  })
})
