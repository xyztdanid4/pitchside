import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

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
