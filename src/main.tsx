import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts: the CSP only allows this origin, and no visitor IPs go to a font CDN.
// Latin subsets and only the weights in use, to keep the download small.
import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-600.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'

// Must run before any schema is created, so it's imported before the app
import '@/app/configureZod.ts'
import '@/index.css'
import { App } from '@/app/App.tsx'

const rootElement = document.querySelector('#root')

if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
