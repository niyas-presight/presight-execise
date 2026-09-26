export type SortField = 'first_name' | 'last_name' | 'age' | 'nationality';
export type SortDirection = 'asc' | 'desc';

export interface UsersQuery {
  q: string;
  nationality: string[];
  hobby: string[];
  sort: SortField;
  direction: SortDirection;
  page: number;
  pageSize: number;
}

export interface ApiIssue {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    issues?: ApiIssue[];
  };
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface ReferenceOption {
  value: string;
  label: string;
}

export interface ApiUser {
  id: number;
  avatar: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  totalFilms: number;
  totalAwards: number;
  hobbies: string[];
}

export interface UsersResponse {
  data: ApiUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  facets: {
    hobbies: FacetCount[];
    nationalities: FacetCount[];
  };
}