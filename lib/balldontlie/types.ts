// Formatos de resposta da BALLDONTLIE (v1)

export interface Team {
  id: number;
  conference: "East" | "West";
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

export interface Game {
  id: number;
  date: string; // "2025-10-22"
  datetime: string | null;
  season: number;
  status: string; // "Final" quando encerrado
  period: number;
  time: string | null;
  postseason: boolean;
  home_team_score: number;
  visitor_team_score: number;
  home_team: Team;
  visitor_team: Team;
}

export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string | null;
  weight: string | null;
  jersey_number: string | null;
  college: string | null;
  country: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team: Team;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: { next_cursor?: number | null; per_page: number };
}
