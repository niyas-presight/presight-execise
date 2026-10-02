import Database from "better-sqlite3";

import type { ReferenceOption, UsersQuery, UsersResponse } from "../types/api";
import { closeDatabase, DEFAULT_DB_PATH, openDatabase } from "./connection";
import { createSchema } from "./schema";

export function initializeDatabase(filePath = DEFAULT_DB_PATH) {
  const database = openDatabase(filePath);
  createSchema(database);
  return database;
}

export { closeDatabase, DEFAULT_DB_PATH, openDatabase };
interface UserRow {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
}

function filteredUsersCte(query: UsersQuery): {
  sql: string;
  parameters: Array<string | number>;
} {
  const conditions: string[] = [];
  const parameters: Array<string | number> = [];

  const searchTerms = query.q.trim().split(/\s+/).filter(Boolean);
  if (searchTerms.length > 0) {
    conditions.push(
      `(${searchTerms.map(() => "(u.first_name LIKE ? ESCAPE '\\' OR u.last_name LIKE ? ESCAPE '\\')").join(" OR ")})`,
    );
    parameters.push(
      ...searchTerms.flatMap((term) => {
        const escapedPrefix = `${term.replace(/[\\%_]/g, "\\$&")}%`;
        return [escapedPrefix, escapedPrefix];
      }),
    );
  }

  if (query.nationality.length > 0) {
    conditions.push(
      `u.nationality COLLATE NOCASE IN (${query.nationality.map(() => "?").join(", ")})`,
    );
    parameters.push(...query.nationality);
  }

  if (query.hobby.length > 0) {
    conditions.push(`u.id IN (
      SELECT uh.user_id
      FROM user_hobbies uh
      JOIN hobbies h ON h.id = uh.hobby_id
      WHERE h.value IN (${query.hobby.map(() => "?").join(", ")})
      GROUP BY uh.user_id
      HAVING COUNT(DISTINCT h.value) = ?
    )`);
    parameters.push(...query.hobby, query.hobby.length);
  }

  return {
    sql: `WITH filtered_users AS (
      SELECT u.* FROM users u${conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : ""}
    )`,
    parameters,
  };
}

export function getHobbiesForUserIds(
  database: InstanceType<typeof Database>,
  userIds: number[],
): Map<number, string[]> {
  const results = new Map<number, string[]>();
  if (userIds.length === 0) {
    return results;
  }

  const rows = database
    .prepare(
      `
      SELECT uh.user_id, h.value
      FROM user_hobbies uh
      JOIN hobbies h ON h.id = uh.hobby_id
      WHERE uh.user_id IN (${userIds.map(() => "?").join(", ")})
      ORDER BY h.value COLLATE NOCASE, h.value
    `,
    )
    .all(...userIds) as Array<{ user_id: number; value: string }>;

  for (const row of rows) {
    const hobbies = results.get(row.user_id) ?? [];
    hobbies.push(row.value);
    results.set(row.user_id, hobbies);
  }

  return results;
}

export function getUsers(
  database: InstanceType<typeof Database>,
  query: UsersQuery,
): UsersResponse {
  const filtered = filteredUsersCte(query);
  const totalRow = database
    .prepare(`${filtered.sql} SELECT COUNT(*) AS total FROM filtered_users`)
    .get(...filtered.parameters) as { total: number };
  const sortColumns: Record<UsersQuery["sort"], string> = {
    first_name: "first_name COLLATE NOCASE",
    last_name: "last_name COLLATE NOCASE",
    age: "age",
    nationality: "nationality COLLATE NOCASE",
  };
  const rows = database
    .prepare(
      `
      ${filtered.sql}
      SELECT id, avatar, first_name, last_name, age, nationality
      FROM filtered_users
      ORDER BY ${sortColumns[query.sort]} ${query.direction}, id ASC
      LIMIT ? OFFSET ?
    `,
    )
    .all(
      ...filtered.parameters,
      query.pageSize,
      (query.page - 1) * query.pageSize,
    ) as UserRow[];

  const hobbiesByUserId = getHobbiesForUserIds(
    database,
    rows.map((row) => row.id),
  );
  const hobbyFacets = database
    .prepare(
      `
      ${filtered.sql}
      SELECT h.value, COUNT(*) AS count
      FROM filtered_users fu
      JOIN user_hobbies uh ON uh.user_id = fu.id
      JOIN hobbies h ON h.id = uh.hobby_id
      GROUP BY h.id
      ORDER BY count DESC, h.value ASC
      LIMIT 20
    `,
    )
    .all(...filtered.parameters) as Array<{ value: string; count: number }>;
  const nationalityFacets = database
    .prepare(
      `
      ${filtered.sql}
      SELECT nationality AS value, COUNT(*) AS count
      FROM filtered_users
      GROUP BY nationality
      ORDER BY count DESC, value ASC
      LIMIT 20
    `,
    )
    .all(...filtered.parameters) as Array<{ value: string; count: number }>;

  return {
    data: rows.map((row) => ({
      id: row.id,
      avatar: row.avatar,
      firstName: row.first_name,
      lastName: row.last_name,
      age: row.age,
      nationality: row.nationality,
      hobbies: hobbiesByUserId.get(row.id) ?? [],
    })),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: totalRow.total,
      hasMore: query.page * query.pageSize < totalRow.total,
    },
    facets: {
      hobbies: hobbyFacets,
      nationalities: nationalityFacets,
    },
  };
}

export function getHobbyOptions(
  database: InstanceType<typeof Database>,
): ReferenceOption[] {
  return database
    .prepare<[], ReferenceOption>(
      "SELECT value, value AS label FROM hobbies ORDER BY value COLLATE NOCASE, value",
    )
    .all();
}

export function getNationalityOptions(
  database: InstanceType<typeof Database>,
): ReferenceOption[] {
  return database
    .prepare<[], ReferenceOption>(
      "SELECT DISTINCT nationality AS value, nationality AS label FROM users ORDER BY value COLLATE NOCASE, value",
    )
    .all();
}
