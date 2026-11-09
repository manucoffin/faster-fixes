# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    CHECKPOINT_DISABLE=1
# Prisma's schema engine, used by `migrate deploy`, links against OpenSSL.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable
WORKDIR /app

FROM base AS build
# The root `prepare` script installs Git hooks, which a build has no use for.
ENV HUSKY=0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --offline --filter "web..."

# Inlined into the build: changing any of them requires a rebuild.
ARG BASE_URL
ARG NEXT_PUBLIC_IS_CLOUD=false
ARG NEXT_PUBLIC_FF_API_ORIGIN
ARG NEXT_PUBLIC_STORAGE_BASE_URL
ARG NEXT_PUBLIC_GITHUB_APP_NAME
ARG STORAGE_BUCKET_NAME
# `web...` also builds the workspace packages and the Prisma client, in dependency
# order. The app directory is moved out so the runtime stage copies it once, with
# its own owner.
RUN pnpm --filter "web..." build \
    && rm -rf apps/web/.next/cache \
    && mv apps/web /web

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    STORAGE_LOCAL_PATH=/data/storage
COPY --from=build /app ./
# Next.js and fumadocs write under the app directory at runtime. Dependencies stay
# owned by root.
COPY --from=build --chown=node:node /web ./apps/web
RUN mkdir -p /data/storage && chown node:node /data/storage
USER node
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["sh", "-c", "cd /app/packages/database && ./node_modules/.bin/prisma migrate deploy && cd /app/apps/web && exec ./node_modules/.bin/next start"]
