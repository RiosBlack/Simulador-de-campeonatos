import { WORLD_CUP_2026_TEAMS } from "@/_data/world-cup-2026-teams";
import { localizeApiFootballTeams } from "@/_utils/team-display";

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

function enrichFromApi(apiTeams: ApiFootballTeam[]): ApiFootballTeam[] {
  const byId = new Map(apiTeams.map((t) => [t.id, t]));

  return localizeApiFootballTeams(
    WORLD_CUP_2026_TEAMS.map((canonical) => {
      const fromApi = byId.get(canonical.id);
      if (!fromApi) return canonical;
      return {
        ...canonical,
        logoUrl: fromApi.logoUrl || canonical.logoUrl,
        code: fromApi.code ?? canonical.code,
      };
    }),
  );
}

/**
 * Retorna as 48 seleções oficiais da Copa 2026.
 * Enriquece logos/códigos com a API quando disponível (sem alterar a lista).
 */
export async function fetchWorldCupTeams(
  preferredSeason = 2026,
  leagueId = 1,
): Promise<FetchWorldCupTeamsResult> {
  const seasons = [preferredSeason, 2022].filter(
    (s, i, arr) => arr.indexOf(s) === i,
  );

  let apiTeams: ApiFootballTeam[] = [];
  let bestSeason: number | null = null;

  for (const season of seasons) {
    const { teams, errors } = await fetchTeamsForSeason(season, leagueId);
    if (teams.length > 0 && !errors?.plan) {
      apiTeams = teams;
      bestSeason = season;
      break;
    }
  }

  const teams = enrichFromApi(apiTeams);

  return {
    teams,
    season: bestSeason,
    supplemented: false,
    warning:
      apiTeams.length === 0
        ? "API indisponível; catálogo gravado com dados locais da Copa 2026."
        : undefined,
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
