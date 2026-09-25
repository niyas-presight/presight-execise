# Project How-To

## Local Setup

Use Node.js 22 and Yarn. From the repository root:

```sh
yarn install
yarn seed
yarn dev
```

`yarn seed` creates or resets `server/data/actors.sqlite` from the checked-in `server/data/actors.json` dataset. Every run replaces the local database contents; it does not fetch seed data from the network.

## Checks

Run these from the repository root:

```sh
yarn test
yarn typecheck
yarn build
```
