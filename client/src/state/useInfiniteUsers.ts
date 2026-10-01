import { useInfiniteQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';

import { fetchUsers } from '../lib/api';
import type { FilterState, UsersResponse } from '../types/api';
import { usersQueryKey } from './useUsers';

export function createInfiniteUsersQueryOptions(filters: FilterState) {
  return {
    queryKey: usersQueryKey(filters),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchUsers(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage: UsersResponse) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (
      previousData: InfiniteData<UsersResponse, number> | undefined,
    ) => previousData,
    retry: false,
  };
}

export function useInfiniteUsers(filters: FilterState) {
  const [debouncedQ] = useDebouncedValue(filters.q.trim(), 250);
  const queryFilters = {
    ...filters,
    q: debouncedQ,
  };
  const query = useInfiniteQuery(createInfiniteUsersQueryOptions(queryFilters));

  return { ...query, queryKey: usersQueryKey(queryFilters) };
}