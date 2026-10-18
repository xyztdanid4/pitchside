/**
 * Renders docs/approach.md to docs/approach.html, a standalone page that is easier to read
 * than the Markdown source. The Markdown file is the source: edit it, then run
 * `pnpm docs:html`.
 */
import { Marked, Renderer } from 'marked'
import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = 'docs/approach.md'
const TARGET = 'docs/approach.html'

// The same anchors GitHub gives headings, so the links inside the document work in both
function slugOf(text) {
  return text
    .toLowerCase()
    .trim()
    .replaceAll(/[^\p{L}\p{N}\s_-]/gu, '')
    .replaceAll(/\s/gu, '-')
}

class ApproachRenderer extends Renderer {
  heading({ tokens, depth, text }) {
    const tag = `h${String(depth)}`
    return `<${tag} id="${slugOf(text)}">${this.parser.parseInline(tokens)}</${tag}>\n`
  }

  // Wide tables scroll inside their own box instead of stretching the page
  table(token) {
    return `<div class="table-scroll">${super.table(token)}</div>\n`
  }
}

// Set through `setOptions`: a renderer instance passed to the constructor is ignored
const marked = new Marked()
marked.setOptions({ renderer: new ApproachRenderer() })

const markdown = readFileSync(SOURCE, 'utf8')
const title = /^# (.+)$/mu.exec(markdown)?.[1] ?? 'Pitchside'
const body = marked.parse(markdown)

const STYLE = `
:root {
  color-scheme: light dark;
  --background: #f5f5f4;
  --surface: #fff;
  --foreground: #1c1917;
  --muted: #57534e;
  --line: #d6d3d1;
  --brand: #15803d;
  --head: #1c1917;
  --on-head: #f5f5f4;
  --code: #f0efed;
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0c0a09;
    --surface: #1c1917;
    --foreground: #e7e5e4;
    --muted: #a8a29e;
    --line: #44403c;
    --brand: #4ade80;
    --head: #e7e5e4;
    --on-head: #1c1917;
    --code: #292524;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font: 1rem/1.6 system-ui, sans-serif;
}
main {
  max-width: 60rem;
  margin: 2rem auto;
  padding: 1.5rem clamp(1rem, 4vw, 3rem) 3rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 0.5rem;
}
/* Full width on phones: a framed card would only waste the narrow screen */
@media (max-width: 40rem) {
  main { margin: 0; border: 0; border-radius: 0; }
}
h1, h2, h3 { line-height: 1.25; scroll-margin-top: 1rem; }
h1 { font-size: 2.25rem; margin-top: 0.5rem; }
h2 { margin-top: 3rem; padding-bottom: 0.4rem; border-bottom: 2px solid var(--brand); }
h3 { margin-top: 2rem; }
hr { display: none; }
a { color: var(--brand); text-underline-offset: 0.15em; }
p, li { max-width: 75ch; }
li + li { margin-top: 0.3rem; }
code {
  padding: 0.1em 0.35em;
  background: var(--code);
  border-radius: 0.25rem;
  font: 0.875em/1.4 ui-monospace, monospace;
}
pre {
  overflow-x: auto;
  padding: 1rem;
  background: var(--code);
  border-radius: 0.375rem;
}
pre code { padding: 0; background: none; }
.table-scroll {
  overflow-x: auto;
  margin: 1rem 0;
  border: 1px solid var(--line);
  border-radius: 0.375rem;
}
/* Narrow screens scroll a table sideways rather than squeezing its columns */
table { width: 100%; min-width: 40rem; border-collapse: collapse; font-size: 0.9rem; }
th, td { padding: 0.5rem 0.75rem; text-align: start; vertical-align: top; }
th { background: var(--head); color: var(--on-head); white-space: nowrap; }
tr + tr td { border-top: 1px solid var(--line); }
td:first-child { font-weight: 600; }
`

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} – Pitchside</title>
    <style>${STYLE}</style>
  </head>
  <body>
    <!-- Generated from approach.md by \`pnpm docs:html\`; edit the Markdown file instead -->
    <main>${body}</main>
  </body>
</html>
`

writeFileSync(TARGET, html)
