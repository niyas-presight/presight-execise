import express from 'express';
import Database from 'better-sqlite3';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { createReferenceRouter } from './routes/reference';
import { createUsersRouter } from './routes/users';

export function createApp(database: InstanceType<typeof Database>) {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestLogger);
  app.use(express.json());
  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });
  app.use('/api', createUsersRouter(database));
  app.use('/api', createReferenceRouter(database));
  app.use((_request, response) => {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
    });
  });
  app.use(errorHandler);

  return app;
}
