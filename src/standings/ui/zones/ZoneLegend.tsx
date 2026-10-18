import type { Zone } from '@/standings/model/zones.ts'
import type { TableRow } from '@/standings/ui/zones/withZones.ts'

import { ZONE_LABEL, ZONE_MARK_CLASS } from '@/standings/ui/zones/zoneStyles.ts'

const ZONES: readonly Zone[] = ['champion', 'relegation']

function positionsText(first: number, last: number): string {
  return first === last ? `Position ${String(first)}` : `Positions ${String(first)}–${String(last)}`
}

/**
 * Explains the row tints. It names the positions in words, so the zones don't rely
 * on telling the colors apart.
 */
export function ZoneLegend({ rows }: { readonly rows: readonly TableRow[] }) {
  return (
    <ul
      aria-label="Zones"
      className="flex flex-wrap gap-x-5 gap-y-2 border-bs border-line px-4 py-3 text-xs text-muted"
    >
      {ZONES.map((zone) => {
        const zoneRows = rows.filter((row) => row.zone === zone)
        const first = zoneRows.at(0)
        const last = zoneRows.at(-1)
        if (first === undefined || last === undefined) {
          return null
        }
        return (
          <li key={zone} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`inline-block h-2.5 w-3.5 rounded-xs ${ZONE_MARK_CLASS[zone]}`}
            />
            {ZONE_LABEL[zone]}: {positionsText(first.position, last.position)}
          </li>
        )
      })}
    </ul>
  )
}
