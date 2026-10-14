import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount rendered components after each test. Testing Library only does this
// automatically when Vitest globals are enabled, and this project doesn't use them.
afterEach(() => {
  cleanup()
})
