import type { CardType } from "@/generated/prisma/client";
import { countMatchCards } from "@/_utils/match-events";
import { isOwnerConflictPending } from "@/_services/knockout.service";

export type StatsChartRow = {
  name: string;
  goals: number;
  logoUrl?: string;
};

export type StatsRankingRow = {
  rank: number;
  name: string;
  value: number;
  logoUrl?: string;
  subtitle?: string;
};

type MatchEventRow = { teamId: number; type: CardType };

type StatsMatch = {
  played: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId: number;
  awayTeamId: number;
  homeStandInUserId: string | null;
  awayStandInUserId: string | null;
  ownerConflictUserId: string | null;
  ownerContinuesTeamId: number | null;
  events: MatchEventRow[];
};

type ChampionshipTeamMeta = {
  teamId: number;
  ownerUserId: string | null;
  team: { name: string; code: string | null; logoUrl: string };
  owner: { name: string } | null;
};

type ParticipantMeta = {
  userId: string;
  name: string;
};

function teamChartLabel(team: ChampionshipTeamMeta["team"]): string {
  return team.code ?? team.name;
}

function teamTableLabel(team: ChampionshipTeamMeta["team"]): string {
  return team.name;
}

function resolveParticipantUserId(
  match: StatsMatch,
  side: "home" | "away",
  ownerUserIdByTeamId: Map<number, string | null>,
): string | null {
  if (isOwnerConflictPending(match)) return null;
  const standInId =
    side === "home" ? match.homeStandInUserId : match.awayStandInUserId;
  if (standInId) return standInId;
  const teamId = side === "home" ? match.homeTeamId : match.awayTeamId;
  return ownerUserIdByTeamId.get(teamId) ?? null;
}

function toRankingRows(
  entries: Array<{ name: string; value: number; logoUrl?: string; subtitle?: string }>,
  options?: { includeZero?: boolean },
): StatsRankingRow[] {
  const filtered = options?.includeZero
    ? entries
    : entries.filter((e) => e.value > 0);

  return filtered
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "pt-BR"))
    .map((entry, index) => ({
      rank: index + 1,
      name: entry.name,
      value: entry.value,
      logoUrl: entry.logoUrl,
      subtitle: entry.subtitle,
    }));
}

function toChartRows(
  entries: Array<{ name: string; value: number; logoUrl?: string }>,
): StatsChartRow[] {
  return entries
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "pt-BR"))
    .map((entry) => ({
      name: entry.name,
      goals: entry.value,
      logoUrl: entry.logoUrl,
    }));
}

export function calculateChampionshipStats(input: {
  teams: ChampionshipTeamMeta[];
  participants: ParticipantMeta[];
  matches: StatsMatch[];
  standInNameById: Map<string, string>;
}): {
  teamGoalsScored: StatsChartRow[];
  teamGoalsConceded: StatsChartRow[];
  teamGoalsScoredTable: StatsRankingRow[];
  teamGoalsConcededTable: StatsRankingRow[];
  playerGoalsScored: StatsChartRow[];
  playerGoalsConceded: StatsChartRow[];
  teamYellowCards: StatsRankingRow[];
  playerYellowCards: StatsRankingRow[];
  teamRedCards: StatsRankingRow[];
  playerRedCards: StatsRankingRow[];
} {
  const { teams, participants, matches, standInNameById } = input;

  const ownerUserIdByTeamId = new Map(
    teams.map((t) => [t.teamId, t.ownerUserId] as const),
  );

  const playerNameById = new Map(
    participants.map((p) => [p.userId, p.name] as const),
  );
  for (const [id, name] of standInNameById) {
    playerNameById.set(id, name);
  }

  const teamGoalsScored = new Map<number, number>();
  const teamGoalsConceded = new Map<number, number>();
  const playerGoalsScored = new Map<string, number>();
  const playerGoalsConceded = new Map<string, number>();
  const teamYellowCards = new Map<number, number>();
  const teamRedCards = new Map<number, number>();
  const playerYellowCards = new Map<string, number>();
  const playerRedCards = new Map<string, number>();

  for (const team of teams) {
    teamGoalsScored.set(team.teamId, 0);
    teamGoalsConceded.set(team.teamId, 0);
    teamYellowCards.set(team.teamId, 0);
    teamRedCards.set(team.teamId, 0);
  }

  for (const participant of participants) {
    playerGoalsScored.set(participant.userId, 0);
    playerGoalsConceded.set(participant.userId, 0);
    playerYellowCards.set(participant.userId, 0);
    playerRedCards.set(participant.userId, 0);
  }

  const playedMatches = matches.filter(
    (m) => m.played && m.homeScore != null && m.awayScore != null,
  );

  for (const match of playedMatches) {
    const homeGoals = match.homeScore ?? 0;
    const awayGoals = match.awayScore ?? 0;

    teamGoalsScored.set(
      match.homeTeamId,
      (teamGoalsScored.get(match.homeTeamId) ?? 0) + homeGoals,
    );
    teamGoalsScored.set(
      match.awayTeamId,
      (teamGoalsScored.get(match.awayTeamId) ?? 0) + awayGoals,
    );
    teamGoalsConceded.set(
      match.homeTeamId,
      (teamGoalsConceded.get(match.homeTeamId) ?? 0) + awayGoals,
    );
    teamGoalsConceded.set(
      match.awayTeamId,
      (teamGoalsConceded.get(match.awayTeamId) ?? 0) + homeGoals,
    );

    const homePlayerId = resolveParticipantUserId(
      match,
      "home",
      ownerUserIdByTeamId,
    );
    const awayPlayerId = resolveParticipantUserId(
      match,
      "away",
      ownerUserIdByTeamId,
    );

    if (homePlayerId) {
      playerGoalsScored.set(
        homePlayerId,
        (playerGoalsScored.get(homePlayerId) ?? 0) + homeGoals,
      );
      playerGoalsConceded.set(
        homePlayerId,
        (playerGoalsConceded.get(homePlayerId) ?? 0) + awayGoals,
      );
    }
    if (awayPlayerId) {
      playerGoalsScored.set(
        awayPlayerId,
        (playerGoalsScored.get(awayPlayerId) ?? 0) + awayGoals,
      );
      playerGoalsConceded.set(
        awayPlayerId,
        (playerGoalsConceded.get(awayPlayerId) ?? 0) + homeGoals,
      );
    }

    const homeCards = countMatchCards(match.events, match.homeTeamId);
    const awayCards = countMatchCards(match.events, match.awayTeamId);

    teamYellowCards.set(
      match.homeTeamId,
      (teamYellowCards.get(match.homeTeamId) ?? 0) + homeCards.yellow,
    );
    teamYellowCards.set(
      match.awayTeamId,
      (teamYellowCards.get(match.awayTeamId) ?? 0) + awayCards.yellow,
    );
    teamRedCards.set(
      match.homeTeamId,
      (teamRedCards.get(match.homeTeamId) ?? 0) + homeCards.red,
    );
    teamRedCards.set(
      match.awayTeamId,
      (teamRedCards.get(match.awayTeamId) ?? 0) + awayCards.red,
    );

    if (homePlayerId) {
      playerYellowCards.set(
        homePlayerId,
        (playerYellowCards.get(homePlayerId) ?? 0) + homeCards.yellow,
      );
      playerRedCards.set(
        homePlayerId,
        (playerRedCards.get(homePlayerId) ?? 0) + homeCards.red,
      );
    }
    if (awayPlayerId) {
      playerYellowCards.set(
        awayPlayerId,
        (playerYellowCards.get(awayPlayerId) ?? 0) + awayCards.yellow,
      );
      playerRedCards.set(
        awayPlayerId,
        (playerRedCards.get(awayPlayerId) ?? 0) + awayCards.red,
      );
    }
  }

  const teamChartEntries = (valueMap: Map<number, number>) =>
    teams.map((t) => ({
      name: teamChartLabel(t.team),
      value: valueMap.get(t.teamId) ?? 0,
      logoUrl: t.team.logoUrl,
    }));

  const teamTableEntries = (valueMap: Map<number, number>) =>
    teams.map((t) => ({
      name: teamTableLabel(t.team),
      value: valueMap.get(t.teamId) ?? 0,
      logoUrl: t.team.logoUrl,
      subtitle: t.owner?.name ?? undefined,
    }));

  const playerEntries = (valueMap: Map<string, number>) =>
    participants.map((p) => ({
      name: p.name,
      value: valueMap.get(p.userId) ?? 0,
    }));

  return {
    teamGoalsScored: toChartRows(teamChartEntries(teamGoalsScored)),
    teamGoalsConceded: toChartRows(teamChartEntries(teamGoalsConceded)),
    teamGoalsScoredTable: toRankingRows(teamTableEntries(teamGoalsScored), {
      includeZero: true,
    }),
    teamGoalsConcededTable: toRankingRows(teamTableEntries(teamGoalsConceded), {
      includeZero: true,
    }),
    playerGoalsScored: toChartRows(playerEntries(playerGoalsScored)),
    playerGoalsConceded: toChartRows(playerEntries(playerGoalsConceded)),
    teamYellowCards: toRankingRows(teamTableEntries(teamYellowCards), {
      includeZero: true,
    }),
    playerYellowCards: toRankingRows(playerEntries(playerYellowCards)),
    teamRedCards: toRankingRows(teamTableEntries(teamRedCards), { includeZero: true }),
    playerRedCards: toRankingRows(playerEntries(playerRedCards)),
  };
}
