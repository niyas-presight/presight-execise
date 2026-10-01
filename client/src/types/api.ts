export type SortField = "first_name" | "last_name" | "age" | "nationality";
export type SortDirection = "asc" | "desc";

export interface FilterState {
  q: string;
  hobbies: string[];
  nationalities: string[];
  sort: SortField;
  direction: SortDirection;
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

export interface ApiIssue {
  field: string;
  message: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    issues?: ApiIssue[];
  };
}
