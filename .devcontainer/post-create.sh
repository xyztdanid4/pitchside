#!/usr/bin/env bash
# Runs once after the dev container is created.
set -euo pipefail

# The node_modules volume is created owned by root
sudo chown node:node node_modules

# The base image ships a global pnpm of a different major version, which would shadow
# Corepack and be rejected by the project's `devEngines` check. Remove it and let
# Corepack provide the exact version from `packageManager` in package.json.
# (Run from $HOME: npm commands inside the project are blocked by `devEngines`.)
(cd "$HOME" && npm uninstall --global pnpm)
sudo corepack enable

pnpm install

# Chromium, WebKit and their system libraries for the end-to-end tests (`pnpm test:e2e`)
pnpm exec playwright install --with-deps chromium webkit
