import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { StatusMessage } from '@/shared/ui/StatusMessage/index.ts'
import { expectNoAxeViolations } from '@/test/axe.ts'

describe('StatusMessage', () => {
  it('announces information politely, without a button', () => {
    render(<StatusMessage kind="info" message="Loading the table…" />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading the table…')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('announces an error right away', () => {
    render(<StatusMessage kind="error" message="The table couldn't be loaded." />)

    expect(screen.getByRole('alert')).toHaveTextContent("The table couldn't be loaded.")
  })

  it('offers a retry when one is given', async () => {
    const onRetry = vi.fn<() => void>()
    render(<StatusMessage kind="error" message="The table couldn't be loaded." onRetry={onRetry} />)

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <StatusMessage kind="error" message="The table couldn't be loaded." onRetry={vi.fn()} />,
    )

    await expectNoAxeViolations(container)
  })
})
