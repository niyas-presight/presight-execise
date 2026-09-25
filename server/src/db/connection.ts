import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data', 'actors.sqlite');

export function openDatabase(filePath = DEFAULT_DB_PATH): InstanceType<typeof Database> {
  const directory = path.dirname(filePath);

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  return new Database(filePath);
}

export function closeDatabase(database: InstanceType<typeof Database>): void {
  database.close();
}
