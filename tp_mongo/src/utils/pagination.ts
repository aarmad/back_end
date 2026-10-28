import { HttpError } from "./HttpError";

export const MAX_LIMIT = 100;

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export interface Page<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const parsePositiveInt = (value: unknown, name: string, fallback: number): number => {
  if (value === undefined || value === "") return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new HttpError(400, `"${name}" doit être un entier ≥ 1`);
  return number;
};

// Lit ?page=&limit= (page 1 et 10 éléments par défaut, 100 au maximum)
export function parsePagination(query: Record<string, unknown>): Pagination {
  const page = parsePositiveInt(query.page, "page", 1);
  const limit = Math.min(parsePositiveInt(query.limit, "limit", 10), MAX_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
}

export function toPage<T>(items: T[], total: number, { page, limit }: Pagination): Page<T> {
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
