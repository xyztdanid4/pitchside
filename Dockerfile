# Multi-stage build. Targets:
#   web  – the production build served by nginx
#   e2e  – the end-to-end tests in Playwright's image (browsers and system libraries included)

# --- Shared: Node with the project's pnpm version ----------------------------------------------
FROM docker.io/library/node:24-slim AS base
# Husky installs git hooks on `pnpm install`; there is no git repository in the image
ENV HUSKY=0
# Corepack provides the exact pnpm version from the `packageManager` field in package.json
RUN corepack enable
WORKDIR /app

# --- Dependencies: only re-installed when the manifest or lockfile changes ----------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# --- Build -------------------------------------------------------------------------------------
FROM deps AS build
COPY . .
RUN pnpm build

# --- web: static files served by an unprivileged nginx (listens on 8080, not as root) ----------
FROM docker.io/nginxinc/nginx-unprivileged:1.29-alpine AS web
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080

# --- e2e: Playwright's image; its version must match @playwright/test in package.json ----------
FROM mcr.microsoft.com/playwright:v1.64.1-noble AS e2e
ENV HUSKY=0
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
CMD ["pnpm", "test:e2e"]
