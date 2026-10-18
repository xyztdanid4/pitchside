import fixture from '@public/data/premier-division.json'
import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { App } from '@/app/App.tsx'
import { expectNoAxeViolations } from '@/test/axe.ts'
import { jsonResponse, stubFetch } from '@/test/fetch.ts'

// Renders the app with the fixture served, and waits until the table is there
async function renderLoadedApp() {
  stubFetch(jsonResponse(fixture))
  const view = render(<App />)
  await screen.findByRole('table', { name: 'Premier Division' })
  return view
}

function clubNames(): (string | null)[] {
  return screen.getAllByRole('rowheader').map((cell) => cell.textContent)
}

describe('App', () => {
  it('renders the app name as the main heading', async () => {
    await renderLoadedApp()

    expect(screen.getByRole('heading', { level: 1, name: 'Pitchside' })).toBeInTheDocument()
  })

  it('shows a loading message until the data arrives', async () => {
    stubFetch(jsonResponse(fixture))
    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading the table…')
    await screen.findByRole('table', { name: 'Premier Division' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  // Positions 3–5 and 7–8 are tied on points, so this order also shows the tie-breaks apply
  it('ranks the clubs from the fixture data', async () => {
    await renderLoadedApp()

    expect(clubNames()).toStrictEqual([
      'Glenhaven City',
      'Fairview FC',
      'Ashford United',
      'Dunwich Town',
      'Bridgeford FC',
      'Castle Athletic',
      'Eastvale Rovers',
      'Highmoor Athletic',
    ])
  })

  it('shows every column of a row, with a signed goal difference', async () => {
    await renderLoadedApp()

    const leaderRow = screen.getByRole('row', { name: /Glenhaven City/ })
    const numbers = within(leaderRow)
      .getAllByRole('cell')
      .map((cell) => cell.textContent)
    expect(numbers).toStrictEqual(['1, Champion', '3', '2', '0', '1', '5', '3', '+2', '6'])
  })

  // The tint alone would rely on color, so the zone is also in the text and the legend
  it('marks the champion and the bottom three as relegated, in words', async () => {
    await renderLoadedApp()

    const firstCells = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0]?.textContent)
    expect(firstCells).toStrictEqual([
      '1, Champion',
      '2',
      '3',
      '4',
      '5',
      '6, Relegation',
      '7, Relegation',
      '8, Relegation',
    ])
    const legend = screen.getByRole('list', { name: 'Zones' })
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toStrictEqual(['Champion: Position 1', 'Relegation: Positions 6–8'])
  })

  // The headers show short labels (P, W, GD, ...), but screen readers get the full names
  it('names every column in full', async () => {
    await renderLoadedApp()

    const fullNames = [
      'Position',
      'Club',
      'Matches played',
      'Wins',
      'Draws',
      'Losses',
      'Goals scored',
      'Goals against',
      'Goal difference',
      'Points',
    ]
    // Finding each header by its accessible name, in order, checks names and order at once
    const headersByName = fullNames.map((name) => screen.getByRole('columnheader', { name }))
    expect(screen.getAllByRole('columnheader')).toStrictEqual(headersByName)
  })

  it('shows an error with a retry that loads the table', async () => {
    stubFetch(new TypeError('Failed to fetch'), jsonResponse(fixture))
    render(<App />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("The table couldn't be loaded.")

    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('table', { name: 'Premier Division' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('treats data of the wrong shape as an error', async () => {
    stubFetch(jsonResponse({ ...fixture, teams: 'none' }))
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent("The table couldn't be loaded.")
  })

  it('says so when the competition has no teams', async () => {
    stubFetch(jsonResponse({ ...fixture, teams: [], matches: [] }))
    render(<App />)

    // The loading message is a status too, so wait for the text first
    await screen.findByText('No teams in this competition yet.')
    expect(screen.getByRole('status')).toHaveTextContent('No teams in this competition yet.')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = await renderLoadedApp()

    await expectNoAxeViolations(container)
  })
})
