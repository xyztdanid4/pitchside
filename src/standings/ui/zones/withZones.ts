import type { StandingRow } from '@/standings/model/calculateStandings.ts'
import type { Zone } from '@/standings/model/zones.ts'

import { zoneFor } from '@/standings/model/zones.ts'

// A standings row as the table shows it: with the zone its position falls into
export type TableRow = StandingRow & { readonly zone: Zone | null }

export function withZones(rows: readonly StandingRow[]): readonly TableRow[] {
  return rows.map((row) => ({ ...row, zone: zoneFor(row.position, rows.length) }))
}
