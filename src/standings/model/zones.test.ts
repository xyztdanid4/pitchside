// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { zoneFor } from '@/standings/model/zones.ts'

function zonesForLeague(teamCount: number) {
  return Array.from({ length: teamCount }, (_, index) => zoneFor(index + 1, teamCount))
}

describe('zoneFor', () => {
  it('marks the top team as champion and the bottom 3 as relegated', () => {
    expect(zonesForLeague(8)).toStrictEqual([
      'champion',
      null,
      null,
      null,
      null,
      'relegation',
      'relegation',
      'relegation',
    ])
  })

  it('keeps the champion out of the relegation zone in a very small league', () => {
    expect(zonesForLeague(3)).toStrictEqual(['champion', 'relegation', 'relegation'])
    expect(zonesForLeague(1)).toStrictEqual(['champion'])
  })

  it.each([
    ['zero', 0],
    ['beyond the number of teams', 9],
    ['not a whole number', 1.5],
  ])('rejects a position that is %s', (_description, position) => {
    expect(() => zoneFor(position, 8)).toThrow(RangeError)
  })
})
