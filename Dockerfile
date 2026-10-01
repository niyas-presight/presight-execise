FROM node:26-bookworm-slim AS base

WORKDIR /app
ENV npm_config_nodedir=/usr/local
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/* \
	&& npm install --global yarn@1.22.22

FROM base AS build

COPY package.json yarn.lock lerna.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN yarn install --frozen-lockfile

COPY client client
COPY server server
RUN yarn build

FROM base AS production-dependencies

COPY package.json yarn.lock lerna.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN yarn install --frozen-lockfile --production=true

FROM node:26-bookworm-slim AS server

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/data/actors.json ./server/data/actors.json

EXPOSE 3000

CMD ["node", "server/dist/main.js"]

FROM nginx:alpine AS client

COPY --from=build /app/client/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80