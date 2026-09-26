import { HttpError } from '../errors/HttpError';
import type { SortDirection, SortField, UsersQuery } from '../types/api';

const sortFields = new Set<SortField>(['first_name', 'last_name', 'age', 'nationality']);
const allowedFields = new Set(['q', 'nationality', 'hobby', 'sort', 'direction', 'page', 'pageSize']);
const maximumPage = Math.floor(Number.MAX_SAFE_INTEGER / 100);

function invalid(field: string, message: string): never {
  throw new HttpError(400, 'INVALID_QUERY_PARAM', 'One or more query parameters are invalid.', [
    { field, message },
  ]);
}

function scalar(query: Record<string, unknown>, field: string): string | undefined {
  const value = query[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    invalid(field, 'Provide this parameter once as a string.');
  }

  return value.trim() || undefined;
}

function list(query: Record<string, unknown>, field: string): string[] {
  const value = query[field];
  if (value === undefined || value === null) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  if (values.some((item) => typeof item !== 'string')) {
    invalid(field, 'Values must be strings.');
  }

  return Array.from(
    new Set(
      (values as string[])
        .flatMap((item) => item.split(','))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function positiveInteger(value: string | undefined, field: string, fallback: number, maximum?: number): number {
  if (value === undefined) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    invalid(field, 'Must be a positive integer.');
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || (maximum !== undefined && parsed > maximum)) {
    invalid(field, maximum ? `Must be between 1 and ${maximum}.` : 'Must be a positive integer.');
  }

  return parsed;
}

export function parseUsersQuery(query: Record<string, unknown>): UsersQuery {
  const unknownField = Object.keys(query).find((field) => !allowedFields.has(field));
  if (unknownField) {
    invalid(unknownField, 'Unknown query parameter.');
  }

  const sortValue = scalar(query, 'sort') ?? 'first_name';
  if (!sortFields.has(sortValue as SortField)) {
    invalid('sort', 'Must be first_name, last_name, age, or nationality.');
  }

  const directionValue = (scalar(query, 'direction') ?? 'asc').toLowerCase();
  if (directionValue !== 'asc' && directionValue !== 'desc') {
    invalid('direction', 'Must be asc or desc.');
  }

  return {
    q: scalar(query, 'q') ?? '',
    nationality: list(query, 'nationality'),
    hobby: list(query, 'hobby'),
    sort: sortValue as SortField,
    direction: directionValue as SortDirection,
    page: positiveInteger(scalar(query, 'page'), 'page', 1, maximumPage),
    pageSize: positiveInteger(scalar(query, 'pageSize'), 'pageSize', 20, 100),
  };
}