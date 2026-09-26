import { Router } from 'express';
import Database from 'better-sqlite3';

import { getUsers } from '../db/repository';
import { parseUsersQuery } from '../query/parseUsersQuery';

export function createUsersRouter(database: InstanceType<typeof Database>): Router {
  const router = Router();

  router.get('/users', (request, response) => {
    const query = parseUsersQuery(request.query as Record<string, unknown>);
    response.json(getUsers(database, query));
  });

  return router;
}