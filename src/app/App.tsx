import { Logo } from '@/app/Logo.tsx'
import { StandingsPage } from '@/standings/ui/StandingsPage.tsx'

export function App() {
  return (
    // Exactly the screen's height, so the page itself never scrolls: only the table does,
    // and its header stays in view on phones too (no scroll area inside a scrolling page)
    <main className="flex h-dvh flex-col px-4 py-6 sm:px-8 sm:py-10">
      <header className="mbe-6 flex shrink-0 items-center gap-3">
        <Logo />
        <h1 className="font-condensed text-3xl leading-none font-bold tracking-wide uppercase">
          Pitchside
        </h1>
      </header>
      <StandingsPage />
    </main>
  )
}
