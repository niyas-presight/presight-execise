# Presight User Directory

A searchable, filterable actor directory built with React, Express, and SQLite.

## Prerequisites

Use Node.js 26 (the version is pinned in `.node-version`) and Yarn 1.22.x. If you use `fnm`, run `fnm use` from the repository root.

## Run Locally

```sh
yarn install
yarn seed
yarn dev
```

Open <http://localhost:5173>. The development server proxies `/api` requests to Express on port 3000.

`yarn seed` creates or resets `server/data/actors.sqlite` from the checked-in `server/data/actors.json` dataset. Seeding is offline and replaces the local database contents.

Run the project checks from the repository root:

```sh
yarn typecheck
yarn build
```

## Run With Docker Compose

Build the image and seed the persistent database before starting the app:

```sh
docker compose build
docker compose run --rm --entrypoint node server server/dist/db/seed.js
docker compose up
```

Open <http://localhost:8080>. Nginx in the `client` container serves the React build and proxies `/api/*` requests to the private Express `server` container. The API is not published directly to the host.

If port 8080 is already in use, run `WEB_PORT=8081 docker compose up` and open <http://localhost:8081> instead.

The server creates the SQLite schema at startup. The seed command is explicit; the image does not contain a pre-seeded database. Data is stored in the `app-data` volume and remains after `docker compose down`. To intentionally reset the Docker database, rerun the seed command. To remove the database volume as well, run `docker compose down --volumes`.

The health endpoint is available at <http://localhost:8080/api/health>.
