import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from '@/App.tsx'
import { expectNoAxeViolations } from '@/test/axe.ts'

describe('App', () => {
  it('renders the app name as the main heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Pitchside' })).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<App />)

    await expectNoAxeViolations(container)
  })
})
