# Pitchside

Football competition standings: league table calculation and a scrollable standings view,
built with React and TypeScript.

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

A complete development environment (Node.js, pnpm, the Playwright browser and the editor
extensions) defined in `.devcontainer/`:

- **VS Code:** install the Dev Containers extension, then run _Dev Containers: Reopen in Container_.
- **JetBrains IDEs:** open `.devcontainer/devcontainer.json` and choose _Create Dev Container_.
- **GitHub Codespaces:** _Code_ → _Codespaces_ → _Create codespace_. Nothing to install locally.

Dependencies are installed automatically; run `pnpm dev` inside the container.

## Scripts

| Command                 | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `pnpm dev`              | Start the dev server                                           |
| `pnpm build`            | Type-check and build for production                            |
| `pnpm preview`          | Preview the production build                                   |
| `pnpm typecheck`        | Run the TypeScript compiler                                    |
| `pnpm test`             | Run unit and component tests once                              |
| `pnpm test:watch`       | Run tests in watch mode                                        |
| `pnpm test:coverage`    | Run tests with a coverage report                               |
| `pnpm test:e2e`         | Run end-to-end tests in a real browser                         |
| `pnpm test:e2e:install` | Download the browser for end-to-end tests                      |
| `pnpm lighthouse`       | Audit the production build with Lighthouse CI                  |
| `pnpm lint`             | Run ESLint                                                     |
| `pnpm lint:css`         | Run Stylelint                                                  |
| `pnpm knip`             | Find unused files, exports and dependencies                    |
| `pnpm depcruise`        | Validate the import graph (cycles, orphans, forbidden imports) |
| `pnpm format`           | Format all files with Prettier                                 |
| `pnpm format:check`     | Check formatting without writing                               |

## End-to-end tests

The end-to-end tests run the production build in a real browser (Chromium) with Playwright, on a
desktop and a mobile viewport. They check what unit tests can't, such as color contrast in light
and dark mode.

### Installing the browser

Playwright uses its own Chromium build (about 120 MB, stored in the user cache). Install it once:

| Operating system                | Command                                             |
| ------------------------------- | --------------------------------------------------- |
| Windows, macOS                  | `pnpm test:e2e:install`                             |
| Ubuntu, Debian                  | `pnpm exec playwright install --with-deps chromium` |
| Other Linux (Fedora, Arch, ...) | `pnpm test:e2e:install`                             |

- **Ubuntu, Debian:** `--with-deps` also installs the required system libraries with `apt`, so it
  asks for `sudo`.
- **Other Linux distributions:** Playwright officially supports only Ubuntu and Debian. Chromium
  usually runs elsewhere too (tested on Fedora 44), but if it fails to start, the error lists the
  missing system libraries; install them with the distribution's package manager.

### Running

```bash
pnpm test:e2e
```

Or in a container, on any operating system, without installing a browser:

```bash
docker compose run --rm --build e2e     # or: podman compose run --rm --build e2e
```

This runs the tests in Playwright's official image against the `web` container.

This builds the app, serves it with `vite preview` and runs the tests. An HTML report is written to
`playwright-report/`, with traces of failed tests (`pnpm exec playwright show-report`).

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

## Git hooks

Installed automatically by `pnpm install` (Husky):

| Hook         | Runs                                                         |
| ------------ | ------------------------------------------------------------ |
| `pre-commit` | ESLint, Stylelint and Prettier on staged files (lint-staged) |
| `commit-msg` | commitlint: messages follow [Conventional Commits][cc]       |
| `pre-push`   | Type check, tests, knip and dependency-cruiser               |

[cc]: https://www.conventionalcommits.org/
