import { Router } from 'express';
import Database from 'better-sqlite3';

import { getHobbyOptions, getNationalityOptions } from '../db/repository';

export function createReferenceRouter(database: InstanceType<typeof Database>): Router {
  const router = Router();

  router.get('/hobbies', (_request, response) => {
    response.json(getHobbyOptions(database));
  });

  router.get('/nationalities', (_request, response) => {
    response.json(getNationalityOptions(database));
  });

  return router;
}