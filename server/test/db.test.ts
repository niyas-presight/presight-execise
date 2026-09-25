import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { closeDatabase, openDatabase } from '../src/db/connection';
import { createSchema } from '../src/db/schema';
import { loadSeedRecords, seedDatabase } from '../src/db/seed';

const tempDirectories: string[] = [];

afterEach(() => {
  for (const dir of tempDirectories.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('database schema and seed', () => {
  it('creates the expected tables, indexes, and seeded relationships', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'presight-db-'));
    tempDirectories.push(tempDir);
    const dbPath = path.join(tempDir, 'actors.sqlite');
    const db = openDatabase(dbPath);

    try {
      createSchema(db);
      const records = loadSeedRecords(path.join(__dirname, '../data/actors.json'));

      const summary = seedDatabase(db, records);

      expect(summary.usersInserted).toBe(records.length);
      expect(summary.hobbiesInserted).toBeGreaterThan(0);
      expect(summary.relationshipsInserted).toBeGreaterThan(0);

      const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
      const hobbyCount = db.prepare('SELECT COUNT(*) AS count FROM hobbies').get() as { count: number };
      const relationCount = db.prepare('SELECT COUNT(*) AS count FROM user_hobbies').get() as { count: number };
      const nationalityCount = db.prepare('SELECT COUNT(DISTINCT nationality) AS count FROM users').get() as { count: number };

      expect(userCount.count).toBe(records.length);
      expect(hobbyCount.count).toBeGreaterThan(0);
      expect(relationCount.count).toBeGreaterThan(0);
      expect(nationalityCount.count).toBeGreaterThan(5);

      const ageCheck = db.prepare('SELECT COUNT(*) AS count FROM users WHERE age < 0 OR age > 120').get() as { count: number };
      const metricCheck = db.prepare(
        'SELECT COUNT(*) AS count FROM users WHERE total_films < 0 OR total_awards < 0',
      ).get() as { count: number };

      expect(ageCheck.count).toBe(0);
      expect(metricCheck.count).toBe(0);
    } finally {
      closeDatabase(db);
    }
  });

  it('reseeds deterministically without leaving stale rows behind', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'presight-db-'));
    tempDirectories.push(tempDir);
    const dbPath = path.join(tempDir, 'actors.sqlite');
    const db = openDatabase(dbPath);

    try {
      createSchema(db);
      const records = loadSeedRecords(path.join(__dirname, '../data/actors.json'));
      const firstSummary = seedDatabase(db, records);
      const secondSummary = seedDatabase(db, records);

      expect(secondSummary.usersInserted).toBe(firstSummary.usersInserted);
      expect(secondSummary.relationshipsInserted).toBe(firstSummary.relationshipsInserted);

      const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
      const hobbyCount = db.prepare('SELECT COUNT(*) AS count FROM hobbies').get() as { count: number };

      expect(userCount.count).toBe(records.length);
      expect(hobbyCount.count).toBeGreaterThan(0);
    } finally {
      closeDatabase(db);
    }
  });
});
