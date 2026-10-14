import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://localhost:${String(PORT)}`

export default defineConfig({
  testDir: './e2e',
  // A failing test in CI is retried once, so a single flaky run doesn't block a merge
  retries: process.env.CI === undefined ? 0 : 1,
  // `.only` left in a test file fails the run in CI instead of silently skipping tests
  forbidOnly: process.env.CI !== undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  // Tests run against the production build, not the dev server: that's what users get
  webServer: {
    command: `pnpm build && pnpm preview --port ${String(PORT)} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: process.env.CI === undefined,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
