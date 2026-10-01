import { useEffect } from 'react';
import type { FilterState } from '../types/api';
import { useFiltersStore } from './filtersStore';
import { parseFiltersFromSearch, serializeFilters } from './searchParams';

interface FiltersStoreApi {
  getState: () => FilterState & { hydrate: (filters: FilterState) => void };
  subscribe: (listener: (state: FilterState, previous: FilterState) => void) => () => void;
}

interface UrlSyncTarget {
  location: { pathname: string; search: string; hash: string };
  history: {
    pushState: (data: unknown, unused: string, url?: string | URL | null) => void;
    replaceState: (data: unknown, unused: string, url?: string | URL | null) => void;
  };
  addEventListener: (type: 'popstate', listener: () => void) => void;
  removeEventListener: (type: 'popstate', listener: () => void) => void;
}

function comparable(filters: FilterState): string {
  return JSON.stringify({
    ...filters,
    hobbies: [...filters.hobbies].sort(),
    nationalities: [...filters.nationalities].sort(),
  });
}

export function startFiltersUrlSync(store: FiltersStoreApi, browser: UrlSyncTarget): () => void {
  store.getState().hydrate(parseFiltersFromSearch(browser.location.search));
  let applyingUrl = false;

  const unsubscribe = store.subscribe((next, previous) => {
    if (applyingUrl || comparable(next) === comparable(previous)) return;

    const nextSearch = serializeFilters(next);
    if (nextSearch === browser.location.search) return;

    const onlyQueryChanged = next.q !== previous.q &&
      next.hobbies.join('\0') === previous.hobbies.join('\0') &&
      next.nationalities.join('\0') === previous.nationalities.join('\0') &&
      next.sort === previous.sort &&
      next.direction === previous.direction;

    if (onlyQueryChanged) {
      browser.history.replaceState(null, '', `${browser.location.pathname}${nextSearch}${browser.location.hash}`);
    } else {
      browser.history.pushState(null, '', `${browser.location.pathname}${nextSearch}${browser.location.hash}`);
    }
  });

  const onPopState = () => {
    applyingUrl = true;
    store.getState().hydrate(parseFiltersFromSearch(browser.location.search));
    applyingUrl = false;
  };

  browser.addEventListener('popstate', onPopState);
  return () => {
    unsubscribe();
    browser.removeEventListener('popstate', onPopState);
  };
}

export function useFiltersUrlSync(): void {
  useEffect(() => startFiltersUrlSync(useFiltersStore as unknown as FiltersStoreApi, window), []);
}