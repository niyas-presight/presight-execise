import type { FilterState } from '../types/api';

export function usersQueryKey(filters: FilterState): readonly unknown[] {
  return [
    'users',
    filters.q.trim(),
    [...filters.hobbies].sort(),
    [...filters.nationalities].sort(),
    filters.sort,
    filters.direction,
  ];
}