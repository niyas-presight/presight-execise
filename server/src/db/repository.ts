import { closeDatabase, DEFAULT_DB_PATH, openDatabase } from './connection';
import { createSchema } from './schema';

export function initializeDatabase(filePath = DEFAULT_DB_PATH) {
  const database = openDatabase(filePath);
  createSchema(database);
  return database;
}

export { closeDatabase, DEFAULT_DB_PATH, openDatabase };
