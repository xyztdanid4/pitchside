import type { MatchResult } from '@/standings/model/calculateStandings.ts'

// Exhaustive: a new result type is a compile error until it gets a label and a color
export function resultChip(result: MatchResult): {
  readonly label: string
  readonly className: string
} {
  switch (result) {
    case 'W': {
      return { label: 'Win', className: 'bg-win text-on-win' }
    }
    case 'D': {
      return { label: 'Draw', className: 'bg-draw text-on-draw' }
    }
    case 'L': {
      return { label: 'Loss', className: 'bg-loss text-on-loss' }
    }
  }
}
