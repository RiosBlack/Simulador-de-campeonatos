import { TEAM_NAMES_PT_BR } from "@/_data/team-names-pt-br";
import type { ApiFootballTeam } from "@/_lib/api-football";

export function localizeTeamNamePtBr(id: number, fallback: string): string {
  return TEAM_NAMES_PT_BR[id] ?? fallback;
}

export function localizeApiFootballTeam(team: ApiFootballTeam): ApiFootballTeam {
  return {
    ...team,
    name: localizeTeamNamePtBr(team.id, team.name),
  };
}

export function localizeApiFootballTeams(
  teams: ApiFootballTeam[],
): ApiFootballTeam[] {
  return teams.map(localizeApiFootballTeam);
}
