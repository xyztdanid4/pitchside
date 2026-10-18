import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  // Also report unused exports of entry files (e.g. src/main.tsx), not only of
  // the modules they import
  includeEntryExports: true,

  ignore: [
    // Loaded by Lighthouse CI (`lhci autorun`), which knip doesn't detect
    'lighthouserc.cjs',
    // Loaded by a <link> in index.html, which knip doesn't follow
    'public/noscript.css',
  ],
}

export default config
