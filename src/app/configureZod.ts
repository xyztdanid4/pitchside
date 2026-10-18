import { z } from 'zod'

// zod 4 compiles fast parsers with `new Function`, and decides whether it can when a
// schema is created. The Content-Security-Policy forbids eval, so the browser would block
// that and log an error. Parsing works without it, and this data is far too small for the
// speed-up to matter. Imported first in main.tsx, before any schema module loads.
z.config({ jitless: true })
