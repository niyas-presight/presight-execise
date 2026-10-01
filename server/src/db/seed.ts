import { readFileSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

import { closeDatabase, openDatabase } from './connection';
import { createSchema } from './schema';
import type { ActorSeedRecord, SeedSummary } from '../types/user';

export const DEFAULT_SEED_FILE_PATH = path.resolve(__dirname, '../../data/actors.json');

const normalizeHobby = (value: string): string => value.trim();

export function validateSeedRecord(record: unknown): ActorSeedRecord {
  if (!record || typeof record !== 'object') {
    throw new Error('Seed record must be an object.');
  }

  const candidate = record as Record<string, unknown>;
  const requiredFields = ['id', 'avatar', 'first_name', 'last_name', 'age', 'nationality', 'hobbies'];

  for (const field of requiredFields) {
    if (!(field in candidate)) {
      throw new Error(`Seed record is missing required field: ${field}`);
    }
  }

  const hobbies = Array.isArray(candidate.hobbies) ? candidate.hobbies : [];
  const normalizedHobbies = Array.from(new Set(hobbies.map((hobby) => normalizeHobby(String(hobby))).filter(Boolean)));

  const validated: ActorSeedRecord = {
    id: Number(candidate.id),
    avatar: String(candidate.avatar),
    first_name: String(candidate.first_name),
    last_name: String(candidate.last_name),
    age: Number(candidate.age),
    nationality: String(candidate.nationality),
    hobbies: normalizedHobbies,
  };

  if (!Number.isInteger(validated.id) || validated.id <= 0) {
    throw new Error(`Seed record id must be a positive integer: ${validated.id}`);
  }

  if (!validated.avatar || !validated.first_name || !validated.last_name || !validated.nationality) {
    throw new Error(`Seed record ${validated.id} includes missing string fields.`);
  }

  if (!Number.isInteger(validated.age) || validated.age < 0 || validated.age > 120) {
    throw new Error(`Seed record ${validated.id} has an invalid age: ${validated.age}`);
  }

  if (validated.hobbies.length > 10) {
    throw new Error(`Seed record ${validated.id} has more than 10 hobbies.`);
  }

  return validated;
}

export function loadSeedRecords(filePath = DEFAULT_SEED_FILE_PATH): ActorSeedRecord[] {
  const raw = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
  const records = Array.isArray(raw) ? raw : (raw as { records?: unknown[] })?.records;

  if (!Array.isArray(records)) {
    throw new Error(`Seed file does not contain an array of actor records: ${filePath}`);
  }

  const validatedRecords = records.map((record) => validateSeedRecord(record));

  if (validatedRecords.length < 500) {
    throw new Error(`Expected at least 500 seed records, received ${validatedRecords.length}.`);
  }

  return validatedRecords;
}

export function seedDatabase(database: Database.Database, records: ActorSeedRecord[]): SeedSummary {
  const insertUser = database.prepare(`
    INSERT INTO users (id, avatar, first_name, last_name, age, nationality)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertHobby = database.prepare(`INSERT OR IGNORE INTO hobbies (value) VALUES (?)`);
  const getHobbyId = database.prepare(`SELECT id FROM hobbies WHERE value = ?`);
  const insertUserHobby = database.prepare(`INSERT OR IGNORE INTO user_hobbies (user_id, hobby_id) VALUES (?, ?)`);

  return database.transaction(() => {
    database.prepare('DELETE FROM user_hobbies').run();
    database.prepare('DELETE FROM hobbies').run();
    database.prepare('DELETE FROM users').run();

    const seenHobbies = new Set<string>();
    const insertedRelations = new Set<string>();

    for (const record of records) {
      insertUser.run(
        record.id,
        record.avatar,
        record.first_name,
        record.last_name,
        record.age,
        record.nationality,
      );

      const uniqueHobbies = Array.from(new Set(record.hobbies.map((hobby) => normalizeHobby(hobby)).filter(Boolean)));

      for (const hobby of uniqueHobbies) {
        seenHobbies.add(hobby);
        insertHobby.run(hobby);
        const hobbyRow = getHobbyId.get(hobby) as { id: number } | undefined;

        if (!hobbyRow) {
          throw new Error(`Missing hobby id after insert for value: ${hobby}`);
        }

        const relationKey = `${record.id}:${hobbyRow.id}`;
        if (!insertedRelations.has(relationKey)) {
          insertUserHobby.run(record.id, hobbyRow.id);
          insertedRelations.add(relationKey);
        }
      }
    }

    return {
      usersInserted: records.length,
      hobbiesInserted: seenHobbies.size,
      relationshipsInserted: insertedRelations.size,
    } satisfies SeedSummary;
  })();
}

export function initializeSeedDatabase(filePath = path.resolve(process.cwd(), 'data', 'actors.sqlite')): Database.Database {
  const database = openDatabase(filePath);
  createSchema(database);
  return database;
}

export function runSeedScript(): void {
  const seedFilePath = DEFAULT_SEED_FILE_PATH;
  const dbPath = path.resolve(process.cwd(), 'data', 'actors.sqlite');
  const database = initializeSeedDatabase(dbPath);

  try {
    const records = loadSeedRecords(seedFilePath);
    const summary = seedDatabase(database, records);

    console.log(
      `Seeded ${summary.usersInserted} actors, ${summary.hobbiesInserted} hobbies, and ${summary.relationshipsInserted} hobby relationships into ${dbPath}`,
    );
  } finally {
    closeDatabase(database);
  }
}

if (require.main === module) {
  runSeedScript();
}
