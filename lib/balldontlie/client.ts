import "server-only";
import { config } from "@/lib/config";
import type { PaginatedResponse } from "./types";

export class BallDontLieError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "BallDontLieError";
  }
}

type Params = Record<string, string | number | (string | number)[] | undefined>;

function buildUrl(path: string, params: Params): string {
  const url = new URL(`${config.apiBaseUrl}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(`${key}[]`, String(v)));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(path: string, params: Params = {}): Promise<T> {
  if (!config.apiKey) {
    throw new BallDontLieError(500, "BALLDONTLIE_API_KEY não configurada no .env.local");
  }

  const res = await fetch(buildUrl(path, params), {
    headers: { Authorization: config.apiKey },
    next: { revalidate: config.revalidateSeconds },
  });

  if (res.status === 429) {
    throw new BallDontLieError(429, "Limite de requisições da API atingido. Tente em 1 minuto.");
  }
  if (res.status === 401 || res.status === 403) {
    throw new BallDontLieError(res.status, "Chave inválida ou endpoint fora do seu plano.");
  }
  if (!res.ok) {
    throw new BallDontLieError(res.status, `Erro da API: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Percorre todas as páginas (a API usa paginação por cursor). */
export async function fetchAll<T>(path: string, params: Params = {}): Promise<T[]> {
  const items: T[] = [];
  let cursor: number | undefined;

  do {
    const page = await request<PaginatedResponse<T>>(path, {
      ...params,
      per_page: 100,
      cursor,
    });
    items.push(...page.data);
    cursor = page.meta?.next_cursor ?? undefined;
  } while (cursor);

  return items;
}
