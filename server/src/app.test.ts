import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { openDatabase } from './db/connection';
import { createSchema } from './db/schema';

const servers: ReturnType<typeof createServer>[] = [];
const databases: ReturnType<typeof openDatabase>[] = [];
const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
  for (const database of databases.splice(0)) {
    database.close();
  }
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('GET /api/health', () => {
  it('returns an ok status', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'presight-health-'));
    tempDirectories.push(directory);
    const database = openDatabase(path.join(directory, 'fixture.sqlite'));
    databases.push(database);
    createSchema(database);
    const app = createApp(database);
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a TCP address');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});
