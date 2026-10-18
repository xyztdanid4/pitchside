import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const LOCAL_URL = `http://localhost:${String(PORT)}`

// When BASE_URL is set (e.g. by the container setup), the tests run against that
// already running server. Otherwise Playwright builds and serves the app itself.
const externalBaseUrl = process.env.BASE_URL

export default defineConfig({
  testDir: './e2e',
  // A failing test in CI is retried once, so a single flaky run doesn't block a merge
  retries: process.env.CI === undefined ? 0 : 1,
  // `.only` left in a test file fails the run in CI instead of silently skipping tests
  forbidOnly: process.env.CI !== undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: externalBaseUrl ?? LOCAL_URL,
    trace: 'retain-on-failure',
  },
  // Tests run against the production build, not the dev server: that's what users get
  ...(externalBaseUrl === undefined && {
    webServer: {
      command: `pnpm build && pnpm preview --port ${String(PORT)} --strictPort`,
      url: LOCAL_URL,
      reuseExistingServer: process.env.CI === undefined,
    },
  }),
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // Safari's WebKit engine has its own layout bugs, and many phone users are on iPhones
    { name: 'iphone', use: { ...devices['iPhone 14'] } },
  ],
})
