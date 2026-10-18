// @vitest-environment node
import { describe, expect, it } from 'vitest'

import type { StandingRow } from '@/standings/model/calculateStandings.ts'

import { calculateStandings } from '@/standings/model/calculateStandings.ts'
import { buildCompetition } from '@/test/buildCompetition.ts'
import { PREMIER_DIVISION } from '@/test/premierDivision.ts'

// One row as a compact, readable tuple:
// name, played, won, drawn, lost, goals for, goals against, goal difference, points, form
function summarize(row: StandingRow) {
  return [
    row.team.name,
    row.played,
    row.won,
    row.drawn,
    row.lost,
    row.goalsFor,
    row.goalsAgainst,
    row.goalDifference,
    row.points,
    row.form.join(''),
  ] as const
}

function namesInOrder(rows: readonly StandingRow[]): string[] {
  return rows.map((row) => row.team.name)
}

describe('calculateStandings', () => {
  it('produces the expected table for the fixture data', () => {
    const rows = calculateStandings(PREMIER_DIVISION)

    expect(rows.map((row) => row.position)).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(rows.map((row) => summarize(row))).toStrictEqual([
      ['Glenhaven City', 3, 2, 0, 1, 5, 3, 2, 6, 'WWL'],
      ['Fairview FC', 3, 1, 2, 0, 1, 0, 1, 5, 'DDW'],
      ['Ashford United', 3, 1, 1, 1, 3, 2, 1, 4, 'WDL'],
      ['Dunwich Town', 3, 1, 1, 1, 3, 3, 0, 4, 'DLW'],
      ['Bridgeford FC', 3, 1, 1, 1, 2, 3, -1, 4, 'LWD'],
      ['Castle Athletic', 3, 0, 3, 0, 2, 2, 0, 3, 'DDD'],
      ['Eastvale Rovers', 3, 0, 2, 1, 3, 4, -1, 2, 'DLD'],
      ['Highmoor Athletic', 3, 0, 2, 1, 3, 5, -2, 2, 'LDD'],
    ])
  })

  describe('scoring', () => {
    it('gives 3 points for a win and none for a loss', () => {
      const rows = calculateStandings(
        buildCompetition(['ashford', 'bridgeford'], [['ashford', 'bridgeford', '2-1']]),
      )

      expect(rows.map((row) => summarize(row))).toStrictEqual([
        ['Ashford United', 1, 1, 0, 0, 2, 1, 1, 3, 'W'],
        ['Bridgeford FC', 1, 0, 0, 1, 1, 2, -1, 0, 'L'],
      ])
    })

    it('gives 1 point to each team for a draw', () => {
      const rows = calculateStandings(
        buildCompetition(['ashford', 'bridgeford'], [['ashford', 'bridgeford', '1-1']]),
      )

      expect(rows.map((row) => summarize(row))).toStrictEqual([
        ['Ashford United', 1, 0, 1, 0, 1, 1, 0, 1, 'D'],
        ['Bridgeford FC', 1, 0, 1, 0, 1, 1, 0, 1, 'D'],
      ])
    })

    it('counts goals the same way for home and away teams', () => {
      const rows = calculateStandings(
        buildCompetition(
          ['ashford', 'bridgeford'],
          [
            ['ashford', 'bridgeford', '3-1'],
            ['bridgeford', 'ashford', '2-0'],
          ],
        ),
      )

      expect(rows.map((row) => summarize(row))).toStrictEqual([
        ['Ashford United', 2, 1, 0, 1, 3, 3, 0, 3, 'WL'],
        ['Bridgeford FC', 2, 1, 0, 1, 3, 3, 0, 3, 'LW'],
      ])
    })
  })

  describe('which matches count', () => {
    it('ignores scheduled matches', () => {
      const rows = calculateStandings(
        buildCompetition(['dunwich', 'eastvale'], [['dunwich', 'eastvale', 'scheduled']]),
      )

      expect(rows.every((row) => row.played === 0)).toBe(true)
    })

    it('ignores live matches, whose result is not final yet', () => {
      const rows = calculateStandings(
        buildCompetition(['ashford', 'fairview'], [['ashford', 'fairview', '0-2', 'live']]),
      )

      expect(rows.every((row) => row.played === 0 && row.points === 0)).toBe(true)
    })

    it('fails loudly if a match refers to a team that is not listed', () => {
      const data = buildCompetition(['ashford', 'bridgeford'], [['ashford', 'bridgeford', '2-0']])
      const withoutBridgeford = {
        ...data,
        teams: data.teams.filter((team) => team.id !== 'bridgeford'),
      }

      expect(() => calculateStandings(withoutBridgeford)).toThrow(
        'Match refers to unknown team "bridgeford"',
      )
    })

    it('lists a team that has not played yet with zeros', () => {
      const rows = calculateStandings(
        buildCompetition(
          ['ashford', 'bridgeford', 'castle-athletic'],
          [['ashford', 'bridgeford', '2-0']],
        ),
      )

      expect(rows.map((row) => summarize(row))).toContainEqual([
        'Castle Athletic',
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        '',
      ])
    })
  })

  describe('order', () => {
    it('ranks by points first', () => {
      // Ashford wins once (3 pts). Bridgeford draws twice (2 pts) and scores more goals.
      const rows = calculateStandings(
        buildCompetition(
          ['ashford', 'bridgeford', 'castle-athletic'],
          [
            ['ashford', 'castle-athletic', '1-0'],
            ['bridgeford', 'castle-athletic', '4-4'],
            ['bridgeford', 'castle-athletic', '0-0'],
          ],
        ),
      )

      expect(namesInOrder(rows).slice(0, 2)).toStrictEqual(['Ashford United', 'Bridgeford FC'])
    })

    it('breaks a points tie by goal difference', () => {
      const rows = calculateStandings(
        buildCompetition(
          ['ashford', 'bridgeford', 'castle-athletic'],
          [
            ['ashford', 'castle-athletic', '1-0'],
            ['bridgeford', 'castle-athletic', '3-0'],
          ],
        ),
      )

      expect(namesInOrder(rows).slice(0, 2)).toStrictEqual(['Bridgeford FC', 'Ashford United'])
    })

    it('breaks a points and goal difference tie by goals scored', () => {
      const rows = calculateStandings(
        buildCompetition(
          ['ashford', 'bridgeford', 'castle-athletic'],
          [
            ['ashford', 'castle-athletic', '1-0'],
            ['bridgeford', 'castle-athletic', '3-2'],
          ],
        ),
      )

      expect(namesInOrder(rows).slice(0, 2)).toStrictEqual(['Bridgeford FC', 'Ashford United'])
    })

    it('breaks a full tie by club name, alphabetically', () => {
      const rows = calculateStandings(
        buildCompetition(
          // Listed out of alphabetical order, so the result can't come from the input order
          ['highmoor', 'ashford', 'castle-athletic'],
          [
            ['highmoor', 'castle-athletic', '1-0'],
            ['ashford', 'castle-athletic', '1-0'],
          ],
        ),
      )

      expect(namesInOrder(rows).slice(0, 2)).toStrictEqual(['Ashford United', 'Highmoor Athletic'])
    })

    it('keeps the listed order for clubs that are equal on every rule, name included', () => {
      // The fixture has no two clubs with the same name, so this adds a reserve side
      // named like its club, listed first
      const data = buildCompetition(['ashford'], [])
      const withReserves = {
        ...data,
        teams: [{ id: 'ashford-reserves', name: 'Ashford United' }, ...data.teams],
      }

      const rows = calculateStandings(withReserves)

      expect(rows.map((row) => row.team.id)).toStrictEqual(['ashford-reserves', 'ashford'])
    })

    it('numbers positions 1 to n without gaps or shared places', () => {
      const rows = calculateStandings(
        buildCompetition(['ashford', 'bridgeford', 'castle-athletic', 'dunwich'], []),
      )

      expect(rows.map((row) => row.position)).toStrictEqual([1, 2, 3, 4])
    })
  })

  describe('form', () => {
    it('lists results oldest first, in the order matches appear', () => {
      const rows = calculateStandings(
        buildCompetition(
          ['ashford', 'bridgeford'],
          [
            ['ashford', 'bridgeford', '1-0'],
            ['ashford', 'bridgeford', '0-0'],
            ['ashford', 'bridgeford', '0-1'],
          ],
        ),
      )

      expect(rows.find((row) => row.team.id === 'ashford')?.form).toStrictEqual(['W', 'D', 'L'])
    })

    it('keeps only the last 5 results', () => {
      const rows = calculateStandings(
        buildCompetition(
          ['ashford', 'bridgeford'],
          [
            ['ashford', 'bridgeford', '0-1'],
            ['ashford', 'bridgeford', '1-0'],
            ['ashford', 'bridgeford', '1-0'],
            ['ashford', 'bridgeford', '0-0'],
            ['ashford', 'bridgeford', '1-0'],
            ['ashford', 'bridgeford', '0-0'],
          ],
        ),
      )

      expect(rows.find((row) => row.team.id === 'ashford')?.form).toStrictEqual([
        'W',
        'W',
        'D',
        'W',
        'D',
      ])
    })
  })
})
