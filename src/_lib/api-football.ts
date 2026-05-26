import { WORLD_CUP_2026_SUPPLEMENT_TEAMS } from "@/_data/world-cup-2026-supplement";

const BASE =
  process.env.API_FOOTBALL_BASE ?? "https://v3.football.api-sports.io";

export type ApiFootballTeam = {
  id: number;
  name: string;
  code: string | null;
  country: string;
  logoUrl: string;
};

export type FetchWorldCupTeamsResult = {
  teams: ApiFootballTeam[];
  season: number | null;
  supplemented: boolean;
  warning?: string;
};

type ApiFootballTeamsResponse = {
  response: Array<{
    team: {
      id: number;
      name: string;
      code: string | null;
      country: string;
      logo: string;
    };
  }>;
  errors?: Record<string, string>;
  results?: number;
};

function getHeaders(): HeadersInit {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new Error("API_FOOTBALL_KEY não configurada");
  }
  return { "x-apisports-key": key };
}

function mapTeamResponse(
  data: ApiFootballTeamsResponse,
): ApiFootballTeam[] {
  return data.response.map((item) => ({
    id: item.team.id,
    name: item.team.name,
    code: item.team.code,
    country: item.team.country,
    logoUrl: item.team.logo,
  }));
}

async function fetchTeamsForSeason(
  season: number,
  leagueId: number,
): Promise<{ teams: ApiFootballTeam[]; errors?: Record<string, string> }> {
  const url = new URL(`${BASE}/teams`);
  url.searchParams.set("league", String(leagueId));
  url.searchParams.set("season", String(season));

  const response = await fetch(url.toString(), {
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API-Football erro: ${response.status}`);
  }

  const data = (await response.json()) as ApiFootballTeamsResponse;

  if (data.errors && Object.keys(data.errors).length > 0) {
    return { teams: [], errors: data.errors };
  }

  return { teams: mapTeamResponse(data) };
}

function mergeTeams(
  primary: ApiFootballTeam[],
  extra: ApiFootballTeam[],
): ApiFootballTeam[] {
  const byId = new Map<number, ApiFootballTeam>();
  for (const team of primary) {
    byId.set(team.id, team);
  }
  for (const team of extra) {
    if (!byId.has(team.id)) {
      byId.set(team.id, team);
    }
  }
  return [...byId.values()];
}

function supplementTo48(teams: ApiFootballTeam[]): {
  teams: ApiFootballTeam[];
  supplemented: boolean;
  warning?: string;
} {
  if (teams.length >= 48) {
    return { teams: teams.slice(0, 48), supplemented: false };
  }

  const merged = mergeTeams(teams, WORLD_CUP_2026_SUPPLEMENT_TEAMS).slice(0, 48);
  const supplemented = merged.length > teams.length;

  if (merged.length < 48) {
    return {
      teams: merged,
      supplemented,
      warning: `Apenas ${merged.length} seleções disponíveis após complemento.`,
    };
  }

  return {
    teams: merged,
    supplemented,
    warning: supplemented
      ? "Plano da API não retornou 48 seleções de 2026; lista completada com seleções nacionais adicionais."
      : undefined,
  };
}

/**
 * Busca seleções da Copa (league=1). Prefere a temporada com mais times (ideal 48 em 2026).
 * Se o plano free só liberar 2022 (32), complementa com seleções extras até 48.
 */
export async function fetchWorldCupTeams(
  preferredSeason = 2026,
  leagueId = 1,
): Promise<FetchWorldCupTeamsResult> {
  const seasons = [
    preferredSeason,
    preferredSeason - 2,
    preferredSeason - 4,
    2022,
    2018,
  ].filter((s, i, arr) => arr.indexOf(s) === i);

  let bestTeams: ApiFootballTeam[] = [];
  let bestSeason: number | null = null;
  let lastPlanError: string | undefined;

  for (const season of seasons) {
    const { teams, errors } = await fetchTeamsForSeason(season, leagueId);

    if (errors?.plan) {
      lastPlanError = errors.plan;
    }

    const isBetter =
      teams.length > bestTeams.length ||
      (teams.length === bestTeams.length && season === preferredSeason);

    if (isBetter && teams.length > 0) {
      bestTeams = teams;
      bestSeason = season;
    }

    if (bestTeams.length >= 48) {
      break;
    }
  }

  if (bestTeams.length < 32) {
    const hint = lastPlanError
      ? ` ${lastPlanError}`
      : " Verifique o plano da API-Football (temporada 2026 exige plano pago).";
    throw new Error(`Nenhuma seleção suficiente retornada pela API.${hint}`);
  }

  const { teams, supplemented, warning } = supplementTo48(bestTeams);

  return {
    teams,
    season: bestSeason,
    supplemented,
    warning,
  };
}

export async function fetchWorldCupFixtures(
  season = 2026,
  leagueId = 1,
) {
  const url = new URL(`${BASE}/fixtures`);
  url.searchParams.set("league", String(leagueId));
  url.searchParams.set("season", String(season));

  const response = await fetch(url.toString(), {
    headers: getHeaders(),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`API-Football fixtures erro: ${response.status}`);
  }

  return response.json();
}
