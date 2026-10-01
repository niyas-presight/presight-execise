import type {
  ApiErrorEnvelope,
  FilterState,
  ReferenceOption,
  UsersResponse,
} from "../types/api";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly issues?: ApiErrorEnvelope["error"]["issues"],
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function buildUsersUrl(
  filters: FilterState,
  page = 1,
  pageSize = 20,
): string {
  const parameters = new URLSearchParams();
  const q = filters.q.trim();

  if (q) parameters.set("q", q);
  for (const hobby of [...new Set(filters.hobbies)].sort())
    parameters.append("hobby", hobby);
  for (const nationality of [...new Set(filters.nationalities)].sort())
    parameters.append("nationality", nationality);
  if (filters.sort !== "first_name") parameters.set("sort", filters.sort);
  if (filters.direction !== "asc")
    parameters.set("direction", filters.direction);
  if (page !== 1) parameters.set("page", String(page));
  if (pageSize !== 20) parameters.set("pageSize", String(pageSize));

  const search = parameters.toString();
  return `/api/users${search ? `?${search}` : ""}`;
}

export async function fetchUsers(
  filters: FilterState,
  page = 1,
  pageSize = 20,
): Promise<UsersResponse> {
  const response = await fetch(buildUsersUrl(filters, page, pageSize), {
    headers: { Accept: "application/json" },
  });
  const body = (await response.json()) as UsersResponse | ApiErrorEnvelope;

  if (!response.ok) {
    const error = "error" in body ? body.error : undefined;
    throw new ApiRequestError(
      error?.message ?? "Unable to load users. Please try again.",
      error?.code ?? "REQUEST_FAILED",
      error?.issues,
    );
  }

  return body as UsersResponse;
}

export async function fetchReferenceOptions(
  kind: "hobbies" | "nationalities",
): Promise<ReferenceOption[]> {
  const response = await fetch(`/api/${kind}`, {
    headers: { Accept: "application/json" },
  });
  const body = (await response.json()) as ReferenceOption[] | ApiErrorEnvelope;

  if (!response.ok) {
    const error = "error" in body ? body.error : undefined;
    throw new ApiRequestError(
      error?.message ?? `Unable to load ${kind}. Please try again.`,
      error?.code ?? "REQUEST_FAILED",
      error?.issues,
    );
  }

  return body as ReferenceOption[];
}
