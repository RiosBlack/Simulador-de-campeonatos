const BASE =
  process.env.API_FOOTBALL_BASE ?? "https://v3.football.api-sports.io";

export type ApiFootballTeam = {
  id: number;
  name: string;
  code: string | null;
  country: string;
  logoUrl: string;
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
};

function getHeaders(): HeadersInit {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new Error("API_FOOTBALL_KEY não configurada");
  }
  return { "x-apisports-key": key };
}

async function fetchTeamsForSeason(
  season: number,
  leagueId: number,
): Promise<ApiFootballTeam[]> {
  const url = new URL(`${BASE}/teams`);
  url.searchParams.set("league", String(leagueId));
  url.searchParams.set("season", String(season));

  const response = await fetch(url.toString(), {
    headers: getHeaders(),
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(`API-Football erro: ${response.status}`);
  }

  const data = (await response.json()) as ApiFootballTeamsResponse;

  if (data.errors && Object.keys(data.errors).length > 0) {
    return [];
  }

  return data.response.map((item) => ({
    id: item.team.id,
    name: item.team.name,
    code: item.team.code,
    country: item.team.country,
    logoUrl: item.team.logo,
  }));
}

/** Tenta 2026; em planos free da API, faz fallback para temporadas anteriores. */
export async function fetchWorldCupTeams(
  preferredSeason = 2026,
  leagueId = 1,
): Promise<ApiFootballTeam[]> {
  const seasons = [
    preferredSeason,
    preferredSeason - 2,
    preferredSeason - 4,
    2022,
    2018,
  ].filter((s, i, arr) => arr.indexOf(s) === i);

  for (const season of seasons) {
    const teams = await fetchTeamsForSeason(season, leagueId);
    if (teams.length >= 32) {
      return teams.slice(0, 48);
    }
  }

  throw new Error(
    "Nenhuma seleção retornada. Verifique o plano da API-Football (temporada 2026 exige plano pago).",
  );
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
