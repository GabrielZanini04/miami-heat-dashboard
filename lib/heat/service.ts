import "server-only";
import { config } from "@/lib/config";
import { fetchAll } from "@/lib/balldontlie/client";
import type { Game, Player } from "@/lib/balldontlie/types";

export type Result = "W" | "L";

export interface GameLogEntry {
  id: number;
  date: string;
  postseason: boolean;
  isHome: boolean;
  opponent: { abbreviation: string; fullName: string };
  heatScore: number;
  opponentScore: number;
  final: boolean;
  result: Result | null; // null = jogo ainda não encerrado
  margin: number | null;
}

export interface WinLoss {
  wins: number;
  losses: number;
  winPct: number;
}

export interface MonthStat {
  key: string; // "2025-10"
  label: string; // "Out/25"
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAllowed: number;
  diff: number; // saldo de pontos do mês
}

export interface SeasonSummary {
  season: number;
  gamesPlayed: number;
  overall: WinLoss;
  home: WinLoss;
  away: WinLoss;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  pointDifferential: number; // diferença média de pontos por jogo
  totalPointsFor: number;
  totalPointsAllowed: number;
  homePointsFor: number;
  awayPointsFor: number;
  lastTen: WinLoss;
  streak: { type: Result; count: number } | null;
  nextGame: GameLogEntry | null;
  monthly: MonthStat[];
  bestMonthByRecord: MonthStat | null;
  bestMonthByDiff: MonthStat | null;
}

function toEntry(game: Game): GameLogEntry {
  const isHome = game.home_team.id === config.heatTeamId;
  const opponent = isHome ? game.visitor_team : game.home_team;
  const heatScore = isHome ? game.home_team_score : game.visitor_team_score;
  const opponentScore = isHome ? game.visitor_team_score : game.home_team_score;
  const final = game.status === "Final";

  return {
    id: game.id,
    date: game.date,
    postseason: game.postseason,
    isHome,
    opponent: { abbreviation: opponent.abbreviation, fullName: opponent.full_name },
    heatScore,
    opponentScore,
    final,
    result: final ? (heatScore > opponentScore ? "W" : "L") : null,
    margin: final ? heatScore - opponentScore : null,
  };
}

function winLoss(games: GameLogEntry[]): WinLoss {
  const wins = games.filter((g) => g.result === "W").length;
  const losses = games.filter((g) => g.result === "L").length;
  const total = wins + losses;
  return { wins, losses, winPct: total ? Number((wins / total).toFixed(3)) : 0 };
}

const avg = (nums: number[]) =>
  nums.length ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)) : 0;
const sum = (nums: number[]) => nums.reduce((a, b) => a + b, 0);

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function buildMonthly(played: GameLogEntry[]): MonthStat[] {
  const byMonth = new Map<string, GameLogEntry[]>();
  for (const game of played) {
    const key = game.date.slice(0, 7); // "2025-10"
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(game);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, games]) => {
      const [year, month] = key.split("-");
      const pointsFor = sum(games.map((g) => g.heatScore));
      const pointsAllowed = sum(games.map((g) => g.opponentScore));
      return {
        key,
        label: `${MONTH_LABELS[Number(month) - 1]}/${year.slice(2)}`,
        wins: games.filter((g) => g.result === "W").length,
        losses: games.filter((g) => g.result === "L").length,
        pointsFor,
        pointsAllowed,
        diff: pointsFor - pointsAllowed,
      };
    });
}

function bestBy(months: MonthStat[], score: (m: MonthStat) => number): MonthStat | null {
  return months.reduce<MonthStat | null>(
    (best, m) => (!best || score(m) > score(best) ? m : best),
    null,
  );
}

/** Todos os jogos do Heat na temporada, em ordem cronológica. */
export async function getGameLog(season: number = config.season): Promise<GameLogEntry[]> {
  const games = await fetchAll<Game>("/games", {
    team_ids: [config.heatTeamId],
    seasons: [season],
  });
  return games.map(toEntry).sort((a, b) => a.date.localeCompare(b.date));
}

/** Função pura: facilita testar sem chamar a API. */
export function buildSummary(log: GameLogEntry[], season: number = config.season): SeasonSummary {
  const regular = log.filter((g) => !g.postseason);
  const played = regular.filter((g) => g.final);

  let streak: SeasonSummary["streak"] = null;
  for (let i = played.length - 1; i >= 0; i--) {
    const r = played[i].result!;
    if (!streak) streak = { type: r, count: 1 };
    else if (r === streak.type) streak.count++;
    else break;
  }

  const ppg = avg(played.map((g) => g.heatScore));
  const oppg = avg(played.map((g) => g.opponentScore));
  const monthly = buildMonthly(played);

  return {
    season,
    gamesPlayed: played.length,
    overall: winLoss(played),
    home: winLoss(played.filter((g) => g.isHome)),
    away: winLoss(played.filter((g) => !g.isHome)),
    pointsPerGame: ppg,
    pointsAllowedPerGame: oppg,
    pointDifferential: Number((ppg - oppg).toFixed(1)),
    totalPointsFor: sum(played.map((g) => g.heatScore)),
    totalPointsAllowed: sum(played.map((g) => g.opponentScore)),
    homePointsFor: sum(played.filter((g) => g.isHome).map((g) => g.heatScore)),
    awayPointsFor: sum(played.filter((g) => !g.isHome).map((g) => g.heatScore)),
    lastTen: winLoss(played.slice(-10)),
    streak,
    nextGame: log.find((g) => !g.final) ?? null,
    monthly,
    bestMonthByRecord: bestBy(monthly, (m) => m.wins - m.losses),
    bestMonthByDiff: bestBy(monthly, (m) => m.diff),
  };
}

export async function getSeasonSummary(season: number = config.season) {
  return buildSummary(await getGameLog(season), season);
}

/**
 * Jogadores associados ao Heat na base da API. O plano grátis só libera o
 * endpoint `/players`, que é histórico (inclui aposentados) — `/players/active`
 * e `/stats`, que dariam o elenco atual de verdade, exigem plano pago.
 * Registros sem nome (dados incompletos na base) são descartados.
 */
export async function getRoster(): Promise<Player[]> {
  const players = await fetchAll<Player>("/players", { team_ids: [config.heatTeamId] });
  return players
    .filter((p) => p.first_name || p.last_name)
    .sort((a, b) => a.last_name.localeCompare(b.last_name));
}
