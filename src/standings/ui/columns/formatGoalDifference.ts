// A positive difference gets an explicit plus sign, as league tables show it: +2, 0, -1
export function formatGoalDifference(goalDifference: number): string {
  return goalDifference > 0 ? `+${String(goalDifference)}` : String(goalDifference)
}
