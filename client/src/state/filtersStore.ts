import { create } from 'zustand';

import type { FilterState, SortDirection, SortField } from '../types/api';
import { defaultFilters } from './searchParams';

interface FiltersStore extends FilterState {
  setQuery: (q: string) => void;
  setHobbies: (hobbies: string[]) => void;
  setNationalities: (nationalities: string[]) => void;
  setSort: (sort: SortField, direction: SortDirection) => void;
  hydrate: (filters: FilterState) => void;
}

const stableValues = (values: string[]) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort();

export const useFiltersStore = create<FiltersStore>((set) => ({
  ...defaultFilters,
  setQuery: (q) => set({ q }),
  setHobbies: (hobbies) => set({ hobbies: stableValues(hobbies) }),
  setNationalities: (nationalities) => set({ nationalities: stableValues(nationalities) }),
  setSort: (sort, direction) => set({ sort, direction }),
  hydrate: (filters) => set({ ...filters, hobbies: stableValues(filters.hobbies), nationalities: stableValues(filters.nationalities) }),
}));