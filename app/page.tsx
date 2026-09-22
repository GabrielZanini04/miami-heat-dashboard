import {
  getSeasonSummary,
  getGameLog,
  getRoster,
  type GameLogEntry,
  type WinLoss,
  type MonthStat,
} from "@/lib/heat/service";
import { BallDontLieError } from "@/lib/balldontlie/client";
import { seasonLabel, config } from "@/lib/config";
import type { Player } from "@/lib/balldontlie/types";
import {
  PointsTrendChart,
  MonthlyRecordChart,
  HomeAwayPointsChart,
  ResultPieChart,
} from "./_components/charts";

function errorMessage(err: unknown): string {
  return err instanceof BallDontLieError || err instanceof Error
    ? err.message
    : "Erro inesperado ao buscar dados.";
}

function recordText(record: WinLoss): string {
  return `${record.wins}-${record.losses}`;
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function NavIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Sidebar() {
  const items = [
    { href: "#visao-geral", label: "Visão Geral", path: "M4 12l8-8 8 8M6 10v10h12V10" },
    { href: "#jogos", label: "Jogos", path: "M4 5h16v14H4zM4 9h16M9 5v4" },
    { href: "#elenco", label: "Elenco", path: "M16 19v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1M12 11a4 4 0 100-8 4 4 0 000 8zM22 19v-1a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  ];

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-surface-border bg-[#0a0a0a] px-4 py-6 lg:flex">
      <div className="flex items-center gap-2 px-2 pb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-heat-red text-sm font-black text-white">
          MH
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">MIAMI HEAT</p>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Dashboard</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((item, i) => (
          <a
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              i === 0
                ? "border-l-2 border-heat-red bg-heat-red/10 text-white"
                : "border-l-2 border-transparent text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <NavIcon path={item.path} />
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface p-5">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-300">{title}</h3>
      {children}
    </div>
  );
}

function ErrorPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-heat-red/40 bg-heat-red/10 px-5 py-4 text-sm text-red-200">
      <p className="font-semibold text-red-100">{title}</p>
      <p className="mt-1">{message}</p>
      {message.includes("BALLDONTLIE_API_KEY") && (
        <p className="mt-2 text-red-300">
          Crie uma chave gratuita em{" "}
          <a href="https://app.balldontlie.io" target="_blank" rel="noopener noreferrer" className="underline">
            app.balldontlie.io
          </a>{" "}
          e adicione em <code className="rounded bg-black/40 px-1 py-0.5">.env.local</code>.
        </p>
      )}
    </div>
  );
}

function HighlightCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-surface-border bg-black/30 px-4 py-3">
      <span className="text-xl leading-none">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-400">{children}</p>
      </div>
    </div>
  );
}

function GamesTable({ games }: { games: GameLogEntry[] }) {
  const recent = [...games].filter((g) => g.final).reverse().slice(0, 10);

  if (recent.length === 0) {
    return <p className="text-sm text-neutral-400">Nenhum jogo encerrado ainda nesta temporada.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-surface-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-black/40 text-xs uppercase tracking-wide text-neutral-400">
          <tr>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Adversário</th>
            <th className="px-4 py-3">Local</th>
            <th className="px-4 py-3">Placar</th>
            <th className="px-4 py-3">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((game) => (
            <tr key={game.id} className="border-t border-surface-border">
              <td className="px-4 py-3 text-neutral-300">{formatDate(game.date)}</td>
              <td className="px-4 py-3 font-medium text-white">{game.opponent.fullName}</td>
              <td className="px-4 py-3 text-neutral-400">{game.isHome ? "Casa" : "Fora"}</td>
              <td className="px-4 py-3 text-neutral-300">
                {game.heatScore}–{game.opponentScore}
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    game.result === "W"
                      ? "rounded bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-400"
                      : "rounded bg-heat-red/20 px-2 py-0.5 font-semibold text-red-300"
                  }
                >
                  {game.result}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RosterGrid({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return <p className="text-sm text-neutral-400">Elenco indisponível no momento.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((player) => (
        <div
          key={player.id}
          className="flex items-center justify-between rounded-lg border border-surface-border bg-surface px-4 py-3"
        >
          <div>
            <p className="font-semibold text-white">
              {player.first_name} {player.last_name}
            </p>
            <p className="text-xs text-neutral-400">
              {player.position || "—"}
              {player.height ? ` · ${player.height}` : ""}
            </p>
          </div>
          <span className="text-lg font-bold text-heat-gold">
            {player.jersey_number ? `#${player.jersey_number}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function monthPhrase(m: MonthStat): string {
  return `${m.label}: ${m.wins}V-${m.losses}D, saldo de ${m.diff > 0 ? "+" : ""}${m.diff} pts`;
}

export default async function Home() {
  const [summaryResult, gamesResult, rosterResult] = await Promise.allSettled([
    getSeasonSummary(),
    getGameLog(),
    getRoster(),
  ]);

  const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
  const games = gamesResult.status === "fulfilled" ? gamesResult.value : null;
  const roster = rosterResult.status === "fulfilled" ? rosterResult.value : null;

  return (
    <div className="flex flex-1 bg-black">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          id="visao-geral"
          className="relative overflow-hidden border-b border-heat-gold/30 bg-gradient-to-b from-heat-red/25 to-black px-6 py-8 sm:px-10"
        >
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-20 [background:repeating-linear-gradient(115deg,var(--heat-red)_0px,var(--heat-red)_18px,transparent_18px,transparent_36px)]" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-heat-gold bg-heat-red text-lg font-black text-white">
              MH
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-heat-gold">NBA · Eastern Conference</p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">MIAMI HEAT</h1>
              <p className="mt-1 text-sm text-neutral-400">Temporada {seasonLabel(config.season)}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-8 px-6 py-8 sm:px-10">
          {summary ? (
            <>
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Pontos marcados" value={String(summary.totalPointsFor)} hint="total na temporada" />
                <StatCard label="Pontos sofridos" value={String(summary.totalPointsAllowed)} hint="total na temporada" />
                <StatCard
                  label="Saldo de pontos"
                  value={`${summary.totalPointsFor - summary.totalPointsAllowed > 0 ? "+" : ""}${
                    summary.totalPointsFor - summary.totalPointsAllowed
                  }`}
                />
                <StatCard label="Jogos disputados" value={String(summary.gamesPlayed)} hint={recordText(summary.overall)} />
                <StatCard label="Aproveitamento" value={`${(summary.overall.winPct * 100).toFixed(1)}%`} />
              </section>

              <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartPanel title="Evolução de pontos · Feitos x Sofridos">
                  {games && <PointsTrendChart games={games} />}
                </ChartPanel>
                <ChartPanel title="Vitórias x Derrotas por mês">
                  <MonthlyRecordChart monthly={summary.monthly} />
                </ChartPanel>
              </section>

              <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <ChartPanel title="Pontos marcados: Casa x Fora">
                  <HomeAwayPointsChart homePointsFor={summary.homePointsFor} awayPointsFor={summary.awayPointsFor} />
                </ChartPanel>
                <ChartPanel title="Distribuição de resultado">
                  <ResultPieChart overall={summary.overall} />
                </ChartPanel>
                <ChartPanel title="Destaques da temporada">
                  <div className="flex flex-col gap-3">
                    <HighlightCard icon="🔥" title="Sequência atual">
                      {summary.streak
                        ? `${summary.streak.count} ${
                            summary.streak.type === "W"
                              ? summary.streak.count === 1
                                ? "vitória seguida"
                                : "vitórias seguidas"
                              : summary.streak.count === 1
                                ? "derrota seguida"
                                : "derrotas seguidas"
                          }`
                        : "—"}
                    </HighlightCard>
                    {summary.bestMonthByRecord && (
                      <HighlightCard icon="📈" title="Melhor mês">
                        {monthPhrase(summary.bestMonthByRecord)}
                      </HighlightCard>
                    )}
                    {summary.nextGame && (
                      <HighlightCard icon="🏀" title="Próximo jogo">
                        {summary.nextGame.isHome ? "vs" : "@"} {summary.nextGame.opponent.fullName} em{" "}
                        {formatDate(summary.nextGame.date)}
                      </HighlightCard>
                    )}
                  </div>
                </ChartPanel>
              </section>
            </>
          ) : (
            <ErrorPanel title="Não foi possível carregar o resumo" message={errorMessage((summaryResult as PromiseRejectedResult).reason)} />
          )}

          <section id="jogos">
            <h2 className="mb-4 text-lg font-bold text-white">Últimos jogos</h2>
            {games ? (
              <GamesTable games={games} />
            ) : (
              <ErrorPanel title="Não foi possível carregar os jogos" message={errorMessage((gamesResult as PromiseRejectedResult).reason)} />
            )}
          </section>

          <section id="elenco">
            <h2 className="text-lg font-bold text-white">Elenco</h2>
            <p className="mb-4 mt-1 text-xs text-neutral-500">
              Base histórica de jogadores do Heat (o plano grátis da API não distingue o elenco atual dos aposentados;
              estatísticas por jogador como pontos, assistências, rebotes, roubos e tocos exigem plano pago).
            </p>
            {roster ? (
              <RosterGrid players={roster} />
            ) : (
              <ErrorPanel title="Não foi possível carregar o elenco" message={errorMessage((rosterResult as PromiseRejectedResult).reason)} />
            )}
          </section>
        </main>

        <footer className="border-t border-surface-border px-6 py-4 text-center text-xs text-neutral-500 sm:px-10">
          Dados via BALLDONTLIE API · Atualizado a cada 30 minutos
        </footer>
      </div>
    </div>
  );
}
