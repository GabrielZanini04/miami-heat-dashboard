import { NextResponse } from "next/server";
import { BallDontLieError } from "@/lib/balldontlie/client";

/** Converte erros em respostas JSON consistentes para as rotas. */
export async function handle<T>(fn: () => Promise<T>) {
  try {
    return NextResponse.json({ data: await fn() });
  } catch (err) {
    const status = err instanceof BallDontLieError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erro inesperado";
    return NextResponse.json({ error: message }, { status });
  }
}

export function seasonFromRequest(req: Request): number | undefined {
  const value = new URL(req.url).searchParams.get("season");
  const season = Number(value);
  return value && Number.isInteger(season) ? season : undefined;
}
