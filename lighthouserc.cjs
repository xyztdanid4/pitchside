// Lighthouse CI: audits the production build and fails if a score drops below a threshold.
// CommonJS (.cjs) because Lighthouse CI loads its config with `require`.

// Reuse Playwright's Chromium, so no separate Chrome installation is needed
const { chromium } = require('@playwright/test')

module.exports = {
  ci: {
    collect: {
      // Lighthouse CI serves the built files itself
      staticDistDir: './dist',
      chromePath: chromium.executablePath(),
      // Scores vary between runs; the median of three is stable enough to assert on
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        // Deterministic categories must be perfect
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
        // Performance depends on the machine and its load, so a low score only warns
        // instead of failing the run at random
        'categories:performance': ['warn', { minScore: 0.9 }],

        // Core Web Vitals, with Google's "good" thresholds
        // Layout shift is deterministic in a lab run, so content jumping while it loads fails
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        // Load time depends on the machine, so it only warns (milliseconds)
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        // A lab run has no real user interactions to measure INP; Total Blocking Time is
        // Lighthouse's stand-in for responsiveness (milliseconds)
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
      },
    },
    upload: {
      // Reports stay local. (`temporary-public-storage` would upload them to a public server.)
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
