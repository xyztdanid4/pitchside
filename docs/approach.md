# Approach and decisions

This document explains what was built, how far each requirement of the brief goes, and why each
decision was made, including the tooling. The [README](../README.md) covers how to run the app;
this is the reasoning behind it.

Every decision follows the same pattern: what was done, why, what the alternative was, and what it
costs.

## Contents

1. [The requirements, one by one](#1-the-requirements-one-by-one)
2. [The discussion topics](#2-the-discussion-topics)
3. [Domain decisions](#3-domain-decisions)
4. [Architecture](#4-architecture)
5. [The table](#5-the-table)
6. [Visual style](#6-visual-style)
7. [Testing strategy](#7-testing-strategy)
8. [Tooling](#8-tooling)
9. [Scope: what is not here, and why](#9-scope-what-is-not-here-and-why)

---

## 1. The requirements, one by one

### 1.1 The standings table

| Requirement                           | Status | How                                                                                                                         | Checked by                                                      |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Recreate the table in the wireframe   | Done   | Same columns in the same order as the mockup, plus the champion and relegation tints and the Last 5 column                  | `App.test.tsx` (header names and order, cell values)            |
| Header row vertically sticky          | Done   | `position: sticky` on the header cells, inside one scroll container                                                         | e2e: _keeps the header row in view while scrolling down_        |
| Rows scroll vertically as one unit    | Done   | One scroll region wraps the whole table; the page itself never scrolls                                                      | e2e: _scrolls only the table, not the page_                     |
| Position and Club horizontally sticky | Done   | Pinned columns with fixed `rem` widths and offsets                                                                          | e2e: _keeps Position and Club in view while scrolling sideways_ |
| Usable at different viewport sizes    | Done   | The same table on every screen; short headers on narrow tables, full names when the table has room; long club names cut off | e2e on desktop, Android and iPhone viewports; 20-club load test |

### 1.2 The calculation

| Requirement                                            | Status | How                                                                                     | Checked by                                        |
| ------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Played, won, drawn, lost, GF, GA, GD, points and form  | Done   | `calculateStandings`, a pure function                                                   | unit tests against the hand-checked fixture table |
| 3 points for a win, 1 for a draw                       | Done   | Named constants `POINTS_FOR_WIN`, `POINTS_FOR_DRAW`                                     | unit + property test: points = 3W + D             |
| Sort: points, goal difference, goals scored, club name | Done   | An ordered list of ranking rules; the first rule that separates two teams decides       | unit + property test on random seasons            |
| Scheduled matches without scores must not contribute   | Done   | Only `completed` matches count; a scheduled match's scores are `null` in the type       | unit test; the type makes misuse a compile error  |
| Keep the calculation logic separate from the UI        | Done   | `standings/model/` has no React and no packages; a lint rule fails the build if it does | dependency-cruiser rule `model-is-pure`           |

### 1.3 The deliverables

| Requirement                         | Status | Where                                                                      |
| ----------------------------------- | ------ | -------------------------------------------------------------------------- |
| Source code in a Git repository     | Done   | This repository, built up in small, conventional commits                   |
| Instructions to run the application | Done   | [README](../README.md): locally, with Docker/Podman, in a Dev Container    |
| Assumptions documented              | Done   | README _Assumptions_, with the reasons in [section 3](#3-domain-decisions) |
| Incomplete features documented      | Done   | [Section 9](#9-scope-what-is-not-here-and-why)                             |

### 1.4 Beyond the brief, and why

- **Loading, error and empty states.** The data is loaded at runtime, so these states exist whether
  they are designed or not. The error state has a retry button.
- **Data validation.** The JSON is checked when it enters the app. Bad data fails with a clear
  message instead of a wrong table ([4.2](#42-data-is-validated-where-it-enters-the-app)).
- **Zones and form.** The mockup shows tinted rows and a Last 5 column, so they are part of
  "recreate the table".
- **The tooling.** Deliberately more than a take-home needs; [section 8](#8-tooling) explains each
  piece and its cost.

---

## 2. The discussion topics

### 2.1 Component hierarchy and data flow

```
main.tsx                      StrictMode, fonts, zod config
└─ App                        page frame: logo, title; exactly the screen's height
   └─ StandingsPage           picks what to show from the async state
      ├─ StatusMessage        loading / error with retry
      └─ StandingsTable       derives the rows, renders title, table and legend
         ├─ DataTable         generic: scroll region, sticky header, pinned columns
         │  └─ cells          from standingsColumns: ShortHeader, FormResults, ...
         └─ ZoneLegend        names the zone positions in words
```

The data flows one way:

```
premier-division.json
  → fetchJson + CompetitionSourceSchema     unknown in, validated domain data out
  → useCompetition (useAsync)               loading | error | success
  → useMemo(calculateStandings → withZones) derived, never stored
  → DataTable                               renders rows through column definitions
```

- **One piece of state.** The only state is the loaded data, held by `useAsync`. The table is
  derived from it with `useMemo`, so it can't get out of step with it.
- **One direction.** Components receive data as props; nothing writes back up.
- **Each step can be replaced on its own.** A real API changes `fetchCompetition`. If the server
  starts sending a computed table, the `calculateStandings` call goes and the table stays.

### 2.2 TypeScript types and key design decisions

- **Hand-written domain types** (`standings/model/competition.ts`). `Match` is a discriminated
  union on `status`: `completed` and `live` have numeric scores, `scheduled` has `null`. The
  compiler rejects using a scheduled match's score before checking its status, so the brief's
  rule is enforced by the type system as well as by the code.
- **The schema is tied to the types in both directions.** `satisfies z.ZodType<…>` makes a
  mismatch a compile error, but only in one direction: an optional field added to the domain type
  would still pass. An exact type test (`expectTypeOf(…).toEqualTypeOf<…>()`) closes that gap.
- **Why not derive the types from the schema (`z.infer`)?** That avoids writing the types twice,
  but couples the domain to zod and to the wire format: a renamed JSON field would change the
  domain types although the rules of football did not. The schema describes the _source_; the
  types describe the _domain_.
- **Types over classes.** Plain `type` aliases and pure functions. React relies on immutable data
  and reference equality, class instances don't survive serialisation, and unions are natural with
  types and awkward with class hierarchies. Everything is `readonly`.
- **Derived values are derived, not stored.** Played, won, drawn and lost are counted from the
  list of results at the end of the calculation, so they can't disagree with each other.
  `StandingRow` adds `position` only after ranking, so a ranking rule can't depend on it.
- **Exhaustive by construction.** `switch` statements over unions are checked by a lint rule, so
  a new match result or status is a compile/lint error until every place handles it.
- **Strict compiler settings**: `strict`, `noUncheckedIndexedAccess` (an array or map lookup may be
  `undefined`), `exactOptionalPropertyTypes`, `noImplicitReturns`.

### 2.3 Scrolling issues, and how they are handled

| Issue                                                                                                                    | Handling                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `position: sticky` sticks to the nearest scrolling ancestor; a horizontal-only scroller loses the vertical sticky header | One scroll region scrolls in both directions; the page is exactly the screen's height (`h-dvh`), so only the region scrolls                                             |
| A scroll area inside a scrolling page "catches" the scroll on phones                                                     | The page doesn't scroll at all; tested by e2e                                                                                                                           |
| Collapsed borders stay behind when cells stick                                                                           | `border-separate` with zero spacing; the row lines are bottom borders on the cells                                                                                      |
| Content shows through sticky cells                                                                                       | Every sticky cell has an opaque background, also on tinted rows and in dark mode; the row tone is a typed choice, not a class, so a caller can't pass a transparent one |
| Pinned columns overlap at larger text sizes                                                                              | Widths and offsets are in `rem` (Tailwind spacing), so they grow with the text; e2e doubles the text size and checks                                                    |
| The corner cell must cover both scrolling directions                                                                     | Three z-index layers: pinned body cells, header cells, pinned header cells on top                                                                                       |
| Visually hidden labels (absolutely positioned) stretched the page sideways                                               | The region is `relative`, so they are clipped inside it; e2e checks the page never scrolls sideways                                                                     |
| Safari has its own sticky bugs                                                                                           | The e2e tests also run on WebKit (iPhone viewport)                                                                                                                      |

### 2.4 Accessibility

- **A real `<table>`**, not a grid of `div`s: a `<caption>`, `<th scope="col">` headers, and the
  club cell as `<th scope="row">`, so a screen reader announces the club with every cell.
- **Keyboard scrolling.** The scroll region is focusable (`tabIndex={0}`), has `role="region"` and
  is named by the caption, so keyboard users can reach and scroll it (WCAG 2.1.1).
- **Abbreviated headers.** The short label (P, W, GD) is `aria-hidden`; the full name is in
  visually hidden text, because `title` alone is not read reliably. Mouse users get a tooltip.
- **Nothing relies on color alone** (WCAG 1.4.1). The zone is announced with the position
  ("1, Champion"), and the legend names the positions in words. Form chips show a letter and are
  read as "Win", "Draw", "Loss"; the list is labelled "Most recent first".
- **Status messages.** Loading and empty states are `role="status"` (polite), the error is
  `role="alert"`.
- **Zoom is never disabled** in the viewport meta, and the layout holds at doubled text size.
- **Color contrast** meets WCAG AA in light and dark mode, checked by axe in a real browser.
- **Without JavaScript**, a `<noscript>` message explains why the page is empty.

Automated checks find only part of all accessibility problems; a manual pass with a keyboard and a
screen reader is still needed before a release.

### 2.5 Performance

- **The calculation** is O(matches + teams · log teams), runs once per loaded data set
  (`useMemo`), and rows are keyed by team id.
- **No virtualisation.** It pays off only with hundreds of rows, and it removes rows from the DOM,
  which hurts find-in-page and screen readers. A league has around 20 clubs.
- **Fonts are self-hosted and preloaded**: Latin subsets, only the weights in use, with
  `<link rel="preload">` added after the build, so text doesn't flash in a fallback font.
- **No layout shift.** Lighthouse CI fails the run if Cumulative Layout Shift goes above 0.1, and
  requires 100 for accessibility, best practices and SEO.
- **Caching in nginx.** Hashed assets are cached for a year as immutable; `index.html` and the data
  are revalidated on every load, so a deploy shows up immediately.
- **What would help next:** the largest paint waits for the script and the data fetch. Embedding the
  data in the HTML or prerendering the table would move it earlier.

---

## 3. Domain decisions

The brief leaves these open. Each one is listed in the README; this is the reasoning.

- **Only `completed` matches count; the `live` match (m13) does not.** A live score can still
  change, and a standings table shows final results. Counting it would show a table that isn't true
  yet.
- **An unknown status (e.g. `postponed`) skips that match with a console warning.** Failing the
  whole load because of one unexpected match is too fragile. A match with a _known_ status but
  invalid data still fails, because then the data itself is wrong. The schema returns the skipped
  matches as data; the warning is logged at the I/O boundary, so the schema stays pure.
- **Match order is time order.** The data has no dates, so the order of the `matches` array decides
  each club's form. This is the one assumption the data can't confirm.
- **Form shows the last 5 completed results, most recent first**, as league tables do. There are
  always 5 slots, so the column keeps its width; slots without a match are empty placeholders.
- **Zones: position 1 is the champion, the bottom 3 are relegated**, as in the mockup. In a league
  too small for both, the champion spot wins.
- **Positions are unique (1 to n).** The brief's last tie-breaker is the club name, so no two clubs
  share a place. The names are compared with a fixed `'en'` collator, so the order is the same on
  every machine. Real tables sometimes show shared places ("=3"); the brief asks for a strict order.
- **Goal difference is shown with a sign**: `+2`, `0`, `-1`.
- **Club names are plain text.** The mockup links them to a placeholder URL; there is no club page
  to link to.

---

## 4. Architecture

### 4.1 Folders decided by one question

```
src/
  app/          the page frame
  standings/    everything about the league table
    model/      types and pure rules (calculateStandings, zoneFor)
    api/        where data comes from (schema, fetchCompetition, useCompetition)
    ui/         the page, the columns, form chips, zone legend
  shared/       generic code that knows nothing about football
    ui/         DataTable, StatusMessage
    lib/        fetchJson, useAsync
```

**Does it know about football?** Then it goes in `standings/`, in the layer that matches what it
does. If it would work for any data, it goes in `shared/`. A second feature (fixtures, say) would
get its own folder next to `standings/` and reuse `shared/`.

This is a reduced form of Feature-Sliced Design: one feature, a shared layer and an app layer. The
full set of FSD layers would be too much at this size. Pure layer folders (`components/`, `hooks/`,
`domain/`) were the alternative; they scatter one feature across many folders and mix generic code
(`useAsync`) with feature code (`useCompetition`).

**The rules are enforced**, not just intended. dependency-cruiser fails the push and CI if:

| Rule                           | Forbids                                                  |
| ------------------------------ | -------------------------------------------------------- |
| `model-is-pure`                | the model importing anything outside itself (React, zod) |
| `shared-knows-no-football`     | `shared/` importing from `standings/` or `app/`          |
| `api-is-not-ui`                | the data layer importing UI code                         |
| `shared-ui-through-public-api` | reaching into a shared component's internal files        |

Each rule was checked by breaking it on purpose.

### 4.2 Data is validated where it enters the app

`response.json()` is typed `any`, and `as CompetitionData` checks nothing: a wrong status, a missing
score or an unknown team would pass the cast and fail later, far from the cause. The zod schema
checks the data once, at the boundary, and returns the domain types, so nothing past it needs
defensive checks. Besides the shape, it checks rules that span records:

- team and match ids are unique;
- every match refers to two existing, different teams;
- scores are non-negative integers, and `null` exactly when the match is scheduled.

**zod** because it is widely known and expresses discriminated unions and cross-record rules
directly. Smaller libraries (valibot, ArkType) would work too; the size difference doesn't matter
here.

**zod and the Content Security Policy.** zod 4 compiles fast parsers with `new Function`, which the
CSP forbids. `configureZod.ts` turns that off (`jitless`) before any schema is created. The
container e2e run, which serves the app with the real CSP, found this; a local run without the CSP
didn't.

### 4.3 Loading the data with `fetch`

The fixture lives in `public/data/` and is fetched at runtime, like an API response. A static
`import` would be simpler, but it has no loading or error states, and TypeScript would infer
`status: string` from the JSON, so it would need validation anyway. The URL is built from Vite's
`BASE_URL`, so the app also works under a sub-path.

### 4.4 State without a library

`useAsync` (about 40 lines) holds `loading | error | success` as a discriminated union, so
impossible combinations ("loading, with an error and data") can't be represented.

- **Races are handled.** Every run gets its own `AbortController`. A retry or an unmount aborts the
  previous run, and its late result is dropped, so an old response never overwrites a newer one.
  React StrictMode's double mount is harmless for the same reason.
- **Why not TanStack Query?** It solves server-state synchronisation: caching, refetching,
  mutations. There is one read-only request here. If those needs appear, it goes behind
  `useCompetition` and the components don't change.
- **Why not Zustand or Redux?** There is no client state that distant components share. A store
  would hold one value that only one component reads.
- **Why not React 19 `use()` with Suspense?** A good option, but it needs a stable promise cache, a
  Suspense boundary and an error boundary for retries. `useAsync` gives the same with explicit
  states that are easy to test.

### 4.5 A generic `DataTable`

`DataTable<Row>` takes rows and a list of `Column<Row>` definitions. All football knowledge is in
`standingsColumns.tsx`.

- **The real gain:** a column defines its header and its cell together, so they can't get out of
  step, instead of 11 hand-written header cells and 11 matching body cells.
- **Type safety:** `Row` is inferred, so columns for one row type can't be used with another.
- **Generic, but not unstyled.** It knows nothing about the data, but it carries the app's look, as a
  design-system component would.
- **The honest trade-off:** it has one consumer. It is kept to what this table uses (`pinned`,
  `isRowHeader`, `align`, `rowTone`); there is no sorting, filtering or paging. TanStack Table would
  bring a dependency for features nobody uses.

---

## 5. The table

### 5.1 One table on every screen, no card view

The brief asks for sticky Position and Club columns _and_ a table usable at every viewport size.
Sticky columns matter most on narrow screens, where the numbers scroll sideways. A card view on
phones would remove them exactly where they help, so the phone gets the same table.

### 5.2 Pinned columns

A pinned column sets its own offset and width with Tailwind classes: Position is
`inset-s-0 w-14`, Club is `inset-s-14 w-44`. `DataTable` adds `sticky` and the z-index.

- **Simple over general.** With exactly two pinned columns, two classes are easier to read than a
  function that adds up offsets. The cost is that the Club offset (`14`) must follow the Position
  width (`w-14`); a comment says so, and the e2e tests fail if they drift apart (checked by changing
  the offset on purpose).
- **`rem`, not `px`.** At doubled text size the text and the columns grow together; with `px` the
  position text would slide under the Club column.
- **Long club names** are cut off with an ellipsis instead of pushing the numbers off a phone
  screen. The full name stays in the tooltip and for screen readers.

### 5.3 Short and full column names

`ShortHeader` shows P, W, GD on a narrow table and the full names when the table has room. "Room"
is a **container query** on the table's region (`@min-[68rem]`), not the screen width: what
matters is how wide the table is, not the screen. The threshold comes from measuring the table with
full names (about 66.6rem), and it is in `rem`, so it grows with the text size. The width doesn't
depend on the data: club names are cut off, numbers have at most 3 characters, form has 5 slots. An
e2e load test with 20 clubs, long names and a full season checks it at 1024, 1280 and 1440 px.

Position always stays short: its column has a fixed width that the full word wouldn't fit.

### 5.4 Zones and form

- **Zones** (`zoneFor`) are a domain rule in `model/`; how they look is in `ui/zones/`. `DataTable`
  takes a row _tone_ (`positive` / `negative`) rather than a class, so the opaque backgrounds the
  sticky cells need are guaranteed by the table.
- **Form chips** come from the domain oldest first and are shown newest first. A UI test pins that
  order, because it is easy to flip by accident.

---

## 6. Visual style

- **A scoreboard look**: Barlow for text, Barlow Condensed for headings and numbers, a dark header
  bar, tinted zone rows, compact rows. Condensed numbers keep the columns narrow, which is what lets
  the full column names fit on a laptop screen.
- **Self-hosted fonts** (`@fontsource`). The CSP allows only this origin, and no visitor IP
  addresses go to a font CDN.
- **Tailwind v4 with strict tokens.** The default palette is removed (`--color-*: initial`), so
  only the project's color tokens exist. A class like `bg-red-500` generates no CSS, and ESLint
  reports it as unknown.
- **Dark mode through variables.** The tokens point to CSS variables, and
  `prefers-color-scheme: dark` swaps the variables. No component has a `dark:` class.
- **Logical properties** (`ms-`, `inset-s-`, `text-start`), so the layout would also work in a
  right-to-left language.

---

## 7. Testing strategy

| Level          | What it catches                                                         | Where                       |
| -------------- | ----------------------------------------------------------------------- | --------------------------- |
| Unit           | calculation rules, schema cases, hooks, components                      | `src/**/*.test.ts(x)`       |
| Property-based | rules that hold for any season, on hundreds of random ones (fast-check) | `*.properties.test.ts`      |
| Type test      | the schema's output and the domain types are exactly the same           | `competitionSchema.test.ts` |
| Accessibility  | axe on rendered components (jsdom), and in real browsers with contrast  | `src/test/axe.ts`, `e2e/`   |
| End-to-end     | sticky behaviour, scrolling, text size, CSP, contrast, three browsers   | `e2e/`                      |
| Lighthouse     | layout shift, accessibility, best practices, SEO                        | `lighthouserc.cjs`          |

- **Property-based tests** state rules instead of examples: goals scored equal goals conceded across
  the league, wins equal losses, points are 3W + D, the order follows the ranking rules, form is
  the last results, oldest first. The schema accepts every valid season unchanged and never
  throws on arbitrary JSON. When a rule is broken, fast-check reports the smallest season that
  shows it; removing the goals-scored tie-breaker produced a two-match counterexample.
- **Test data is project data.** Tests use the fixture's clubs and matches, run through the real
  schema rather than cast.
- **jsdom has no layout.** Unit tests check what renders and how it behaves; sticky positioning,
  contrast and scrolling need a real browser, so Playwright runs the production build on Chromium
  (desktop and Android viewports) and WebKit (iPhone viewport). A test also fails on any console or
  page error, which is how CSP violations show up.
- **Coverage** must stay above 90%, but coverage only shows that code ran. The important tests were
  checked by breaking the code on purpose (pixel offsets, a missing `h-dvh`, a too-small breakpoint,
  `satisfies` alone, each layer rule) and seeing them fail.

---

## 8. Tooling

The tooling is deliberately more than a take-home needs. It shows the baseline I would set up for a
team, where mistakes are caught by a tool rather than in review. The feature itself is kept to the
brief. Each tool is below, with what it does, why it is there and what it costs.

### 8.1 Build and framework: Vite, React, TypeScript

- **Vite, no framework.** One read-only view of static data needs no server rendering, routing or
  server code, so a build tool is enough. Next.js or React Router's framework mode would bring a
  server runtime and conventions that solve nothing here.
- **Revisit when:** several pages (routing), SEO or first-paint requirements (SSR/SSG), or a backend
  for the frontend.

### 8.2 Language: strict TypeScript

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`,
  `noImplicitOverride`, `erasableSyntaxOnly`, `verbatimModuleSyntax`.
- `noUncheckedIndexedAccess` matters most here: the calculation looks teams up by id, and the
  compiler makes the "not found" case explicit.
- **Cost:** some extra checks in code (`=== undefined`), which are the point.

### 8.3 Package manager and runtime versions: pnpm, Node

- **pnpm**: strict `node_modules` (code can only import declared packages, no phantom dependencies),
  a shared store, and it blocks dependency install scripts by default.
- **Versions are enforced, not suggested.** `devEngines` rejects npm and unsupported Node versions,
  `engine-strict` makes the Node range a hard error, `packageManager` pins the pnpm version, and
  `.nvmrc` picks Node 24 (the current LTS) for version managers. The allowed Node range is derived
  from what the dependencies require, not from preference.
- **Why:** "works on my machine" problems usually come from a different Node or package manager;
  this fails at install time with a clear message instead of later with a strange one.

### 8.4 Formatting: Prettier, EditorConfig

- Prettier owns all formatting; ESLint only checks correctness (`eslint-config-prettier`).
  Tailwind classes are sorted by `prettier-plugin-tailwindcss`.
- Set up before any code, so no commit mixes reformatting with real changes.

### 8.5 Linting: ESLint, Stylelint

- **ESLint** with the type-aware presets (`typescript-eslint` strict and stylistic, `@eslint-react`,
  `react-hooks`, `jsx-a11y` strict, `unicorn`, Tailwind correctness, Vitest, Testing Library,
  Playwright) and `--max-warnings 0`.
- **Custom rules** where presets stop: exhaustive `switch` over unions, no truthiness checks on
  numbers or strings, sort with a compare function, naming conventions, size limits (complexity,
  depth, parameters), named exports only, imports only through the `@/` alias, sorted imports.
  Every custom rule has a comment saying what it prevents, with a wrong and a right example. A rule
  that can't be justified in one sentence isn't in the config.
- **Stylelint** with the standard config, property ordering and accessibility rules (no
  `outline: none`, focus styles with hover styles, reduced motion respected). No `!important`, no ID
  selectors, limited specificity.
- **Cost:** a learning curve for a new contributor; the comments in the config are there for that.

### 8.6 Code health: knip, dependency-cruiser

- **knip** reports unused files, exports and dependencies, including dependencies used but only
  installed indirectly.
- **dependency-cruiser** turns the architecture into checks: no circular imports, no orphan files,
  only declared packages, no dev dependencies in app code, no app code importing tests, and the
  layer rules in [4.1](#41-folders-decided-by-one-question).

### 8.7 Tests: Vitest, Testing Library, fast-check, axe, Playwright

- **Vitest** shares Vite's configuration and transforms, so tests see the code as the build does.
  Mocks and stubbed globals are reset after every test.
- **Testing Library** queries by role and accessible name, the way users and assistive technology
  find things, so tests double as accessibility checks.
- **fast-check** for the property-based tests in [section 7](#7-testing-strategy).
- **axe-core** through a small typed helper, because the usual wrapper (`vitest-axe`) is
  unmaintained.
- **Playwright** for real browsers, with `@axe-core/playwright` in light and dark mode.

### 8.8 Performance budget: Lighthouse CI

- Audits the production build three times. **Fails** below 100 for accessibility, best practices or
  SEO, or above 0.1 layout shift. **Warns** for performance below 90, Largest Contentful Paint above
  2.5 s or Total Blocking Time above 200 ms, because those depend on the machine's load.
- Uses the Chromium Playwright already installed, so there is no second browser to install.

### 8.9 Git hooks: Husky, lint-staged, commitlint

| Hook         | Runs                                             | Why there                                        |
| ------------ | ------------------------------------------------ | ------------------------------------------------ |
| `pre-commit` | ESLint, Stylelint, Prettier on staged files only | fast; fixes are re-staged                        |
| `commit-msg` | commitlint (Conventional Commits)                | a readable, consistent history                   |
| `pre-push`   | type check, unit tests, knip, dependency-cruiser | they need the whole project; too slow per commit |

**Trade-off:** hooks check the working tree, not exactly what is committed, so they are fast
feedback, not the gate. The gate is CI on a clean checkout. The hooks are kept simple rather than
stashing work, which can go wrong.

### 8.10 Containers: Docker or Podman, nginx

- **One multi-stage `Dockerfile`, one `compose.yaml`**, working with both Docker and Podman. The
  `web` target serves the production build from an unprivileged nginx: static files only, no Node,
  no source. The `e2e` target is Playwright's official image, which has every browser's system
  libraries, so all three browser projects run on any operating system.
- **nginx** sets a strict Content Security Policy (only this origin, no inline scripts or styles, no
  framing) and other security headers, caches hashed assets as immutable and revalidates the rest.
  The headers live in one file included by every `location`, because an `add_header` inside a
  `location` drops the inherited ones.
- **The service is called `web`, not `app`**: `.app` is a real top-level domain on Chromium's HSTS
  preload list, so `http://app:8080` was forced to HTTPS and every test failed.
- **The container e2e script stops leftover containers first**, so the tests never run against an
  old build. A stale container once made a run falsely green.
- **In real production** a static app would rather be served from a CDN; the container gives a
  reproducible run and an environment with the real headers.

### 8.11 Development environment: Dev Container

- `.devcontainer/` gives Node, pnpm, the Playwright browsers and the editor extensions in VS Code,
  JetBrains IDEs or GitHub Codespaces. `node_modules` lives in a volume, so the host's and the
  container's installs never overwrite each other.
- `.vscode/extensions.json` recommends the same extensions outside the container.

### 8.12 Continuous integration: GitHub Actions

- Two parallel jobs on a clean checkout: `checks` (formatting, ESLint, Stylelint, types, unit tests
  with coverage, knip, dependency-cruiser) and `browser` (e2e on Chromium and WebKit, Lighthouse).
  Reports are kept as artifacts, also when a step fails. Node comes from `.nvmrc`, pnpm from
  `packageManager`, and the lockfile is frozen.
- **Manual trigger only**, to save Actions minutes. Adding `push` and `pull_request` triggers is a
  two-line change.

---

## 9. Scope: what is not here, and why

| Not done                                                           | Why, and what would come next                                                                                                                                         |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The live match is not shown                                        | Its result isn't final ([section 3](#3-domain-decisions)). A "live" toggle would pass the counted statuses to `calculateStandings` and mark the table as provisional. |
| No error boundary                                                  | Loading and validation errors are handled; a render error would leave an empty page. A production app would have one at the root.                                     |
| Pinned columns are wider than a 320 px screen at doubled text size | A rare combination. The fix would be a screen-relative Club width, such as `min(11rem, 40vw)`.                                                                        |
| Skipped matches only show in the console                           | Deliberate: they are not part of the table. A note under the title would make them visible to users.                                                                  |
| Shared positions ("=3") are not shown                              | The brief's last tie-breaker is the club name, which gives a strict order.                                                                                            |
| No sorting, filtering or virtualisation                            | The brief doesn't ask for them, and a 20-club table doesn't need them.                                                                                                |
| English only, with a hand-written plural                           | Internationalisation is outside the brief. `Intl.PluralRules` and a message catalogue would be the next step.                                                         |
| CI doesn't run automatically                                       | Saves Actions minutes; it is complete and runs on demand.                                                                                                             |
| Club names are not links                                           | The mockup's links point to a placeholder; there is no club page.                                                                                                     |
