/** CDN da API-Football — usado só no script de download local. */
export const REMOTE_TEAM_LOGO_CDN =
  "https://media.api-sports.io/football/teams";

export function remoteTeamLogoUrl(teamId: number): string {
  return `${REMOTE_TEAM_LOGO_CDN}/${teamId}.png`;
}

/** Caminho same-origin servido em `public/teams/`. */
export function localTeamLogoUrl(teamId: number): string {
  return `/teams/${teamId}.png`;
}

export function withLocalTeamLogo<T extends { id: number; logoUrl: string }>(
  team: T,
): T {
  return { ...team, logoUrl: localTeamLogoUrl(team.id) };
}
