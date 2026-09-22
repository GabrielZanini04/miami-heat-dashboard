export const config = {
  apiBaseUrl: "https://api.balldontlie.io/v1",
  apiKey: process.env.BALLDONTLIE_API_KEY,
  season: Number(process.env.NBA_SEASON ?? 2025),
  heatTeamId: 16, // Miami Heat na BALLDONTLIE (confirme em GET /teams)
  revalidateSeconds: 60 * 30, // cache de 30 min para respeitar o limite da API
} as const;

/** Rótulo legível: 2025 -> "2025-26" */
export function seasonLabel(season: number = config.season): string {
  return `${season}-${String(season + 1).slice(-2)}`;
}
