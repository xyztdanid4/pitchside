# Pitchside

Football competition standings: league table calculation and a scrollable standings view,
built with React and TypeScript.

The reasoning behind every decision, requirement by requirement and tool by tool, is in
[docs/approach.md](docs/approach.md).

## What it does

- Loads the competition (teams and matches) from `public/data/premier-division.json`, validates
  it, and calculates the league table in the browser.
- Ranks by points, then goal difference, then goals scored, then club name.
- Shows the table with the header row and the Position and Club columns fixed while the rest
  scrolls, on every screen size.
- Marks the champion and the relegation zone, and shows each club's last five results.
- Handles loading, errors (with a retry) and an empty competition.

## Assumptions

The brief leaves these open; this is how the app decides them.

- **Only `completed` matches count.** A `live` match is left out because its result isn't final;
  a `scheduled` match has no score.
- **A match with an unknown status** (e.g. `postponed`) is skipped with a console warning, so one
  unexpected match doesn't stop the whole table from loading. Any other invalid data is an error.
- **Match order is time order.** The data has no dates, so the order of the `matches` array
  decides the order of each club's form.
- **Form** shows the last 5 completed results, most recent first. Slots without a match yet are
  empty.
- **Zones:** position 1 is the champion, the bottom 3 are relegated (as in the layout mockup).
- **Positions are unique** (1 to n): the club name is the last tie-breaker, so no two clubs share
  a place. Clubs equal on every rule keep their order from the data.
- **Goal difference** is shown with a sign: `+2`, `0`, `-1`.

## Architecture

```
src/
  app/              the page frame: App, Logo
  standings/        everything about the league table
    model/          types, calculateStandings, zoneFor     pure functions, no React, no packages
    api/            the zod schema, fetchCompetition,      where data comes from, validated once
                    useCompetition
    ui/             the page, the table's columns, the form chips, the zone legend
  shared/           generic code that knows nothing about football
    ui/             DataTable, StatusMessage
    lib/            fetchJson, useAsync
  test/             test helpers
```

**Where does code go?** If it knows about football, it goes in `standings/`, in the layer
that matches what it does. If it would work for any data, it goes in `shared/`.

- **The calculation is separate from the UI.** `calculateStandings` is a pure function over
  plain data: same input, same output. The table only renders the rows it gets.
- **Data is validated where it enters the app.** `fetch` returns untyped JSON; the zod schema
  checks it and returns the domain types, so nothing past it needs defensive checks. A type test
  checks that the schema's output and the hand-written domain types are exactly the same.
- **State is derived, not stored.** The only state is the loaded data in `useCompetition`; the
  table is computed from it with `useMemo`.
- **The layer rules are enforced:** dependency-cruiser fails the build if, for example, the
  model imports React or something in `shared/` imports from `standings/`.

## Getting started

### Locally

Requires Node.js 22.22.2+ or 24.15+ (24 recommended, see `.nvmrc`) and pnpm 10. The versions
are enforced: installing with an unsupported Node.js version or with npm fails.

```bash
pnpm install
pnpm dev
```

Use `pnpm exec` (or `pnpm dlx`) instead of `npx`: `npx` runs through npm, which the
project's package manager check rejects.

### With Docker or Podman

No Node.js or pnpm needed, only Docker or Podman. Both read the same `compose.yaml`:

```bash
docker compose up --build web     # or: podman compose up --build web
```

This builds the production version and serves it at <http://localhost:8080>.

### In a Dev Container

A complete development environment (Node.js, pnpm, the Playwright browsers and the editor
extensions) defined in `.devcontainer/`:

- **VS Code:** install the Dev Containers extension, then run _Dev Containers: Reopen in Container_.
- **JetBrains IDEs:** open `.devcontainer/devcontainer.json` and choose _Create Dev Container_.
- **GitHub Codespaces:** _Code_ → _Codespaces_ → _Create codespace_. Nothing to install locally.

Dependencies are installed automatically; run `pnpm dev` inside the container.

## Scripts

| Command                   | Description                                                    |
| ------------------------- | -------------------------------------------------------------- |
| `pnpm dev`                | Start the dev server                                           |
| `pnpm build`              | Type-check and build for production                            |
| `pnpm preview`            | Preview the production build                                   |
| `pnpm typecheck`          | Run the TypeScript compiler                                    |
| `pnpm test`               | Run unit and component tests once                              |
| `pnpm test:watch`         | Run tests in watch mode                                        |
| `pnpm test:coverage`      | Run tests with a coverage report                               |
| `pnpm test:e2e`           | Run end-to-end tests in real browsers                          |
| `pnpm test:e2e:install`   | Download the browsers for end-to-end tests                     |
| `pnpm test:e2e:container` | Run end-to-end tests in containers, all browsers, any OS       |
| `pnpm lighthouse`         | Audit the production build with Lighthouse CI                  |
| `pnpm lint`               | Run ESLint                                                     |
| `pnpm lint:css`           | Run Stylelint                                                  |
| `pnpm knip`               | Find unused files, exports and dependencies                    |
| `pnpm depcruise`          | Validate the import graph (cycles, orphans, forbidden imports) |
| `pnpm format`             | Format all files with Prettier                                 |
| `pnpm format:check`       | Check formatting without writing                               |
| `pnpm docs:html`          | Render `docs/approach.md` as a standalone HTML page            |

## End-to-end tests

The end-to-end tests run the production build in real browsers with Playwright: Chromium on a
desktop and an Android phone viewport, and WebKit (Safari's engine) on an iPhone viewport. They
check what unit tests can't, such as color contrast in light and dark mode, and that the header
and the pinned columns stay in place while the table scrolls.

### Installing the browsers

Playwright uses its own Chromium and WebKit builds (stored in the user cache). Install them once:

| Operating system                | Command                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| Windows, macOS                  | `pnpm test:e2e:install`                                    |
| Ubuntu, Debian                  | `pnpm exec playwright install --with-deps chromium webkit` |
| Other Linux (Fedora, Arch, ...) | `pnpm test:e2e:install`                                    |

- **Ubuntu, Debian:** `--with-deps` also installs the required system libraries with `apt`, so it
  asks for `sudo`.
- **Other Linux distributions:** Playwright officially supports only Ubuntu and Debian. Chromium
  usually runs elsewhere too (tested on Fedora 44); WebKit doesn't, because it needs Ubuntu's
  system libraries. There, run the Chromium projects locally
  (`pnpm test:e2e --project=desktop --project=mobile`), and all of them with
  `pnpm test:e2e:container`.

### Running

```bash
pnpm test:e2e
```

This builds the app, serves it with `vite preview` and runs the tests. An HTML report is written to
`playwright-report/`, with traces of failed tests (`pnpm exec playwright show-report`).

Or in containers, on any operating system and without installing a browser:

```bash
pnpm test:e2e:container
```

This uses Docker or Podman, whichever is installed. It builds the app into the `web` container
(nginx, with the production headers) and runs all three browser projects, WebKit included, in
Playwright's official image against it. Containers left over from an earlier run are stopped
first, so the tests never run against an old build of the app.

## Lighthouse

```bash
pnpm lighthouse
```

Builds the app and audits it three times with Lighthouse CI, using the Chromium installed for the
end-to-end tests (`pnpm test:e2e:install`).

- **Fails** if accessibility, best practices or SEO score below 100, or if Cumulative Layout Shift
  is above 0.1 (content jumping while the page loads).
- **Warns** if performance is below 90, Largest Contentful Paint above 2.5 s or Total Blocking Time
  above 200 ms. These depend on the machine's load, so they don't fail the run.

Reports are written to `.lighthouseci/`.

## Tooling

The tooling is deliberately more than a take-home needs: strict ESLint and TypeScript settings,
Stylelint, knip, dependency-cruiser, property-based, end-to-end and Lighthouse checks, Docker
and CI. It shows the baseline for a team project, where mistakes are caught by a tool rather than
in review. The feature itself is kept to what the brief asks for.

## Git hooks

Installed automatically by `pnpm install` (Husky):

| Hook         | Runs                                                         |
| ------------ | ------------------------------------------------------------ |
| `pre-commit` | ESLint, Stylelint and Prettier on staged files (lint-staged) |
| `commit-msg` | commitlint: messages follow [Conventional Commits][cc]       |
| `pre-push`   | Type check, tests, knip and dependency-cruiser               |

[cc]: https://www.conventionalcommits.org/

## Continuous integration

`.github/workflows/ci.yml` runs every check from a clean checkout, so only committed code is
tested: formatting, ESLint, Stylelint, type check, unit tests with coverage, knip,
dependency-cruiser, end-to-end tests and Lighthouse. Reports are uploaded as artifacts.

Automatic triggers are disabled to save GitHub Actions minutes: the workflow runs only when started
by hand (_Actions_ → _CI_ → _Run workflow_). Adding `push` and `pull_request` triggers enables it on
every change.
