import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  // Also report unused exports of entry files (e.g. src/main.tsx), not only of
  // the modules they import
  includeEntryExports: true,

  ignore: [
    // Loaded by a <link> in index.html, which knip doesn't follow
    'public/noscript.css',
  ],

  ignoreDependencies: [
    // Installed with the Testing Library toolkit for simulating user input;
    // no test imports it yet
    '@testing-library/user-event',
  ],
}

export default config
