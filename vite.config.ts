import type { Plugin } from 'vite'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Preloads the self-hosted fonts from the built index.html. Without it the browser only
 * requests a font once the app has rendered text in it, and shows a fallback font until
 * then. The file names carry a build hash, so the links are added after the build.
 */
function preloadFonts(): Plugin {
  let base = '/'
  return {
    name: 'preload-fonts',
    apply: 'build',
    configResolved(config) {
      // So the links also work when the app is deployed under a sub-path
      base = config.base
    },
    transformIndexHtml(_html, context) {
      const fontFiles = Object.keys(context.bundle ?? {}).filter((file) => file.endsWith('.woff2'))
      return fontFiles.map((file) => ({
        tag: 'link',
        // `crossorigin` is required for font preloads, even from the same origin
        attrs: {
          rel: 'preload',
          href: `${base}${file}`,
          as: 'font',
          type: 'font/woff2',
          crossorigin: '',
        },
        injectTo: 'head',
      }))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadFonts()],
  resolve: {
    // Resolve the `@/*` and `@public/*` aliases from the `paths` in tsconfig.app.json
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Every test starts from clean mocks, no state leaks between tests
    restoreMocks: true,
    // ...and from the real globals: `vi.stubGlobal('fetch', ...)` is undone after each test
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
      // The build fails if coverage drops below these percentages
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
})
