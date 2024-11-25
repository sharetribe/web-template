ARG NODE_RUNTIME_VERSION=21.7.2

FROM public.ecr.aws/docker/library/node:${NODE_RUNTIME_VERSION}-alpine AS base

ENV NODE_ENV=production

RUN apk add --no-cache curl

FROM base AS deps

WORKDIR /app

COPY package.json yarn.lock ./

COPY patches ./patches

RUN yarn install --immutable --production && npx update-browserslist-db@latest

FROM base AS frontend

ENV DISABLE_ESLINT_PLUGIN=true

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY --from=deps /app/package.json ./

COPY src ./src

COPY public ./public

# Use this to cache bust secrets mounted (env)
ARG CACHE_CHECKSUM

RUN --mount=type=secret,id=env,target=/app/.env yarn build

FROM deps AS release

WORKDIR /app

COPY --from=frontend --chown=node:node /app/build ./build

COPY --chown=node:node ./server ./server

COPY --chown=node:node ./scripts ./scripts

USER node:node

CMD [ "node", "--icu-data-dir=node_modules/full-icu", "server/index.js" ]
