const CHAMPION_SPOTS = 1
const RELEGATION_SPOTS = 3

export type Zone = 'champion' | 'relegation'

/**
 * The zone a final position falls into, or `null` for mid-table.
 * In a league too small for both zones, the champion spot wins.
 */
export function zoneFor(position: number, teamCount: number): Zone | null {
  if (!Number.isSafeInteger(position) || position < 1 || position > teamCount) {
    throw new RangeError(`Position ${String(position)} is not between 1 and ${String(teamCount)}`)
  }
  if (position <= CHAMPION_SPOTS) {
    return 'champion'
  }
  return position > teamCount - RELEGATION_SPOTS ? 'relegation' : null
}
