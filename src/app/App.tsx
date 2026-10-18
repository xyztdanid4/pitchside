import { StandingsPage } from '@/standings/ui/StandingsPage.tsx'

export function App() {
  return (
    // Exactly the screen's height, so the page itself never scrolls: only the table does
    // (no scroll area inside a scrolling page)
    <main className="flex h-dvh flex-col px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="mbe-6 shrink-0 text-2xl font-bold text-brand">Pitchside</h1>
      <StandingsPage />
    </main>
  )
}
