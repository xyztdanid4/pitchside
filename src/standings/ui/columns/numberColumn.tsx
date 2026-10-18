import type { ReactNode } from 'react'

import type { Column } from '@/shared/ui/DataTable/index.ts'
import type { TableRow } from '@/standings/ui/zones/withZones.ts'

import { ShortHeader } from '@/standings/ui/columns/ShortHeader.tsx'

type NumberColumn = {
  readonly key: string
  readonly short: string
  readonly full: string
  readonly value: (row: TableRow) => ReactNode
}

// A numeric column, centered under its short header
export function numberColumn({ key, short, full, value }: NumberColumn): Column<TableRow> {
  return {
    key,
    header: <ShortHeader short={short} full={full} />,
    cell: value,
    align: 'center',
  }
}
