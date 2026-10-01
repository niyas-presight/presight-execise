import { useEffect, useRef, useState } from "react";

import type { FilterState } from "../types/api";

function serializeFilters(filters: FilterState): string {
  return JSON.stringify({
    q: filters.q,
    hobbies: [...filters.hobbies].sort(),
    nationalities: [...filters.nationalities].sort(),
    sort: filters.sort,
    direction: filters.direction,
  });
}

export function useNetworkWarning(
  filters: FilterState,
  hasNetworkError: boolean,
) {
  const [show, setShow] = useState(false);
  const previousFiltersRef = useRef<FilterState | null>(null);

  const hideNetworkNotification = () => setShow(false);

  useEffect(() => {
    const currentFilters = {
      ...filters,
      hobbies: [...filters.hobbies].sort(),
      nationalities: [...filters.nationalities].sort(),
    };

    const changed =
      previousFiltersRef.current !== null &&
      serializeFilters(currentFilters) !== serializeFilters(previousFiltersRef.current);

    if (changed && !navigator.onLine) {
      setShow(true);
    }

    previousFiltersRef.current = currentFilters;
  }, [filters]);

  useEffect(() => {
    if (!hasNetworkError) {
      return;
    }

    setShow(true);
    const timeoutId = window.setTimeout(() => setShow(false), 5000);

    return () => window.clearTimeout(timeoutId);
  }, [hasNetworkError]);

  return {
    isNetworkNotificationVisible: show,
    hideNetworkNotification,
  };
}
