import type { RowTone } from '@/shared/ui/DataTable/index.ts'
import type { Zone } from '@/standings/model/zones.ts'

export const ZONE_LABEL: Readonly<Record<Zone, string>> = {
  champion: 'Champion',
  relegation: 'Relegation',
}

// How the table highlights each zone's rows
export const ZONE_TONE: Readonly<Record<Zone, RowTone>> = {
  champion: 'positive',
  relegation: 'negative',
}

// The stronger zone color, for the dot at the position and the legend
export const ZONE_MARK_CLASS: Readonly<Record<Zone, string>> = {
  champion: 'bg-champion-mark',
  relegation: 'bg-relegation-mark',
}
