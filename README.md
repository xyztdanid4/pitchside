# Pitchside

Football competition standings: league table calculation and a scrollable standings view,
built with React and TypeScript.

## Getting started

Requires Node.js 22.22.2+ or 24.15+ (24 recommended, see `.nvmrc`) and pnpm 10. The versions
are enforced: installing with an unsupported Node.js version or with npm fails.

```bash
pnpm install
pnpm dev
```

Use `pnpm exec` (or `pnpm dlx`) instead of `npx`: `npx` runs through npm, which the
project's package manager check rejects.

## Scripts

| Command              | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `pnpm dev`           | Start the dev server                                           |
| `pnpm build`         | Type-check and build for production                            |
| `pnpm preview`       | Preview the production build                                   |
| `pnpm typecheck`     | Run the TypeScript compiler                                    |
| `pnpm test`          | Run unit and component tests once                              |
| `pnpm test:watch`    | Run tests in watch mode                                        |
| `pnpm test:coverage` | Run tests with a coverage report                               |
| `pnpm lint`          | Run ESLint                                                     |
| `pnpm lint:css`      | Run Stylelint                                                  |
| `pnpm knip`          | Find unused files, exports and dependencies                    |
| `pnpm depcruise`     | Validate the import graph (cycles, orphans, forbidden imports) |
| `pnpm format`        | Format all files with Prettier                                 |
| `pnpm format:check`  | Check formatting without writing                               |

## Git hooks

Installed automatically by `pnpm install` (Husky):

| Hook         | Runs                                                         |
| ------------ | ------------------------------------------------------------ |
| `pre-commit` | ESLint, Stylelint and Prettier on staged files (lint-staged) |
| `commit-msg` | commitlint: messages follow [Conventional Commits][cc]       |
| `pre-push`   | Type check, tests, knip and dependency-cruiser               |

[cc]: https://www.conventionalcommits.org/
