import type { FilterState, SortDirection, SortField } from '../types/api';

export const defaultFilters: FilterState = {
  q: '',
  hobbies: [],
  nationalities: [],
  sort: 'first_name',
  direction: 'asc',
};

const sortFields = new Set<SortField>(['first_name', 'last_name', 'age', 'nationality']);

function normalizedValues(parameters: URLSearchParams, key: string): string[] {
  return Array.from(
    new Set(
      parameters
        .getAll(key)
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort();
}

export function parseFiltersFromSearch(search: string): FilterState {
  const parameters = new URLSearchParams(search);
  const sort = parameters.get('sort') as SortField | null;
  const direction = parameters.get('direction') as SortDirection | null;

  return {
    q: parameters.get('q')?.trim() ?? '',
    hobbies: normalizedValues(parameters, 'hobby'),
    nationalities: normalizedValues(parameters, 'nationality'),
    sort: sort && sortFields.has(sort) ? sort : defaultFilters.sort,
    direction: direction === 'asc' || direction === 'desc' ? direction : defaultFilters.direction,
  };
}

export function serializeFilters(filters: FilterState): string {
  const parameters = new URLSearchParams();
  const q = filters.q.trim();

  if (q) parameters.set('q', q);
  for (const hobby of Array.from(new Set(filters.hobbies.map((value) => value.trim()).filter(Boolean))).sort()) {
    parameters.append('hobby', hobby);
  }
  for (const nationality of Array.from(new Set(filters.nationalities.map((value) => value.trim()).filter(Boolean))).sort()) {
    parameters.append('nationality', nationality);
  }
  if (filters.sort !== defaultFilters.sort) parameters.set('sort', filters.sort);
  if (filters.direction !== defaultFilters.direction) parameters.set('direction', filters.direction);

  const search = parameters.toString();
  return search ? `?${search}` : '';
}