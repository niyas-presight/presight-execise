import { createServer } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import app from './app';

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

describe('GET /api/health', () => {
  it('returns an ok status', async () => {
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
