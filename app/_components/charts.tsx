"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { GameLogEntry, MonthStat, WinLoss } from "@/lib/heat/service";

const COLORS = {
  red: "#ba0c2f",
  gold: "#f9a01b",
  grid: "#262626",
  text: "#a3a3a3",
};

const tooltipStyle = {
  background: "#141414",
  border: "1px solid #262626",
  borderRadius: 8,
  color: "#f5f5f5",
  fontSize: 12,
};

function formatShortDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function PointsTrendChart({ games }: { games: GameLogEntry[] }) {
  const data = games
    .filter((g) => g.final)
    .map((g) => ({ date: formatShortDate(g.date), Feitos: g.heatScore, Sofridos: g.opponentScore }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="date" stroke={COLORS.text} fontSize={11} interval="preserveStartEnd" minTickGap={30} />
        <YAxis stroke={COLORS.text} fontSize={11} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#f5f5f5" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: COLORS.text }} />
        <Line type="monotone" dataKey="Feitos" stroke={COLORS.red} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Sofridos" stroke="#8a8a8a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MonthlyRecordChart({ monthly }: { monthly: MonthStat[] }) {
  const data = monthly.map((m) => ({ label: m.label, Vitórias: m.wins, Derrotas: m.losses }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" stroke={COLORS.text} fontSize={11} />
        <YAxis stroke={COLORS.text} fontSize={11} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#f5f5f5" }} cursor={{ fill: "#ffffff08" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: COLORS.text }} />
        <Bar dataKey="Vitórias" fill={COLORS.gold} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Derrotas" fill={COLORS.red} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HomeAwayPointsChart({ homePointsFor, awayPointsFor }: { homePointsFor: number; awayPointsFor: number }) {
  const data = [
    { label: "Em casa", pontos: homePointsFor },
    { label: "Fora", pontos: awayPointsFor },
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} horizontal={false} />
        <XAxis type="number" stroke={COLORS.text} fontSize={11} />
        <YAxis type="category" dataKey="label" stroke={COLORS.text} fontSize={12} width={70} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#f5f5f5" }} cursor={{ fill: "#ffffff08" }} />
        <Bar dataKey="pontos" fill={COLORS.red} radius={[0, 4, 4, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ResultPieChart({ overall }: { overall: WinLoss }) {
  const data = [
    { name: "Vitórias", value: overall.wins },
    { name: "Derrotas", value: overall.losses },
  ];
  const colors = [COLORS.gold, COLORS.red];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={colors[i]} stroke="none" />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12, color: COLORS.text }} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#f5f5f5" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
