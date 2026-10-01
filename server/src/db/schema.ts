import Database from 'better-sqlite3';

export function createSchema(database: Database.Database): void {
  database.pragma('foreign_keys = ON');
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      avatar TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      age INTEGER NOT NULL CHECK (age BETWEEN 0 AND 120),
      nationality TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hobbies (
      id INTEGER PRIMARY KEY,
      value TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS user_hobbies (
      user_id INTEGER NOT NULL,
      hobby_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, hobby_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (hobby_id) REFERENCES hobbies(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_nationality ON users (nationality);
    CREATE INDEX IF NOT EXISTS idx_users_first_name_search ON users (first_name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_users_last_name_search ON users (last_name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_user_hobbies_hobby_id ON user_hobbies (hobby_id);
  `);

  const userColumns = new Set(
    (database.pragma('table_info(users)') as Array<{ name: string }>).map(({ name }) => name),
  );

  for (const column of ['total_films', 'total_awards']) {
    if (userColumns.has(column)) {
      database.exec(`ALTER TABLE users DROP COLUMN ${column}`);
    }
  }
}
