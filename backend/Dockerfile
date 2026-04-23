# syntax=docker/dockerfile:1

FROM node:24-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN pnpm run build

FROM base AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

RUN npm install -g pm2

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY tsconfig.json tsconfig.build.json ./
COPY migrations ./migrations
COPY src ./src
COPY package.json ./

EXPOSE 8000

CMD ["bash", "-c", "pnpm run migration:run && pm2-runtime start dist/main.js"]
