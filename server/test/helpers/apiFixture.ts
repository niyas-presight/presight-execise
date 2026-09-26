import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';

import { createApp } from '../../src/app';
import { openDatabase } from '../../src/db/connection';
import { createSchema } from '../../src/db/schema';

interface FixtureUser {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  hobbies: string[];
}

const fixtureUsers: FixtureUser[] = [
  { id: 1, firstName: 'Alice', lastName: 'Adams', age: 30, nationality: 'American', hobbies: ['Reading', 'Hiking'] },
  { id: 2, firstName: 'Adam', lastName: 'Zed', age: 30, nationality: 'Canadian', hobbies: ['Reading', 'Cooking'] },
  { id: 3, firstName: 'Zack', lastName: 'Adams', age: 40, nationality: 'British', hobbies: ['Reading', 'Hiking'] },
  { id: 4, firstName: 'Mohamed', lastName: 'Saleh', age: 35, nationality: 'Egyptian', hobbies: ['Running'] },
  { id: 5, firstName: 'Samoh', lastName: 'Person', age: 33, nationality: 'Egyptian', hobbies: ['Running'] },
  { id: 6, firstName: '100%Real', lastName: 'Percent', age: 28, nationality: 'American', hobbies: ['Reading'] },
  { id: 7, firstName: '100_Real', lastName: 'Underscore', age: 29, nationality: 'Canadian', hobbies: ['Reading'] },
  { id: 8, firstName: 'Layla', lastName: 'Mohamed', age: 31, nationality: 'Lebanese', hobbies: ['Reading', 'Hiking'] },
  { id: 9, firstName: 'adam', lastName: 'adamson', age: 31, nationality: 'american', hobbies: ['Reading', 'Hiking'] },
  { id: 10, firstName: 'A\\Path', lastName: 'Hobbies', age: 30, nationality: 'American', hobbies: [] },
];

export async function createApiFixture() {
  const directory = mkdtempSync(path.join(tmpdir(), 'presight-api-'));
  const database = openDatabase(path.join(directory, 'fixture.sqlite'));
  createSchema(database);

  const insertUser = database.prepare(`
    INSERT INTO users (id, avatar, first_name, last_name, age, nationality, total_films, total_awards)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertHobby = database.prepare('INSERT OR IGNORE INTO hobbies (value) VALUES (?)');
  const getHobby = database.prepare('SELECT id FROM hobbies WHERE value = ?');
  const insertRelation = database.prepare('INSERT INTO user_hobbies (user_id, hobby_id) VALUES (?, ?)');

  for (const user of fixtureUsers) {
    insertUser.run(user.id, `/avatars/${user.id}.jpg`, user.firstName, user.lastName, user.age, user.nationality, user.id + 10, user.id % 7);

    for (const hobby of user.hobbies) {
      insertHobby.run(hobby);
      const hobbyRow = getHobby.get(hobby) as { id: number };
      insertRelation.run(user.id, hobbyRow.id);
    }
  }

  for (let index = 0; index < 22; index += 1) {
    const id = index + 11;
    const value = String(index).padStart(2, '0');
    insertUser.run(id, `/avatars/${id}.jpg`, `Person ${value}`, 'Filler', 20 + index, `Country ${value}`, id + 10, id % 7);
    const hobby = `Hobby ${value}`;
    insertHobby.run(hobby);
    const hobbyRow = getHobby.get(hobby) as { id: number };
    insertRelation.run(id, hobbyRow.id);
  }

  const server = createServer(createApp(database));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Test server did not expose a TCP address');
  }

  return {
    database,
    request: (url: string) => fetch(`http://127.0.0.1:${address.port}${url}`),
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      database.close();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
