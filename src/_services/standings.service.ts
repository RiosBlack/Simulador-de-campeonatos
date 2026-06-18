import type { CardType, Match } from "@/generated/prisma/client";
import { calculateFairPlayScore } from "@/_services/fairplay.service";
import { countMatchCards } from "@/_utils/match-events";

export type StandingRow = {
  teamId: number;
  teamName: string;
  logoUrl: string;
  ownerUserId: string | null;
  ownerName: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  fairPlay: number;
  yellowCards: number;
  redCards: number;
  position: number;
};

type TeamMeta = {
  teamId: number;
  teamName: string;
  logoUrl: string;
  ownerUserId: string | null;
  ownerName: string | null;
};

type MatchWithEvents = Match & {
  events: Array<{ teamId: number; type: CardType }>;
};

function initStats(meta: TeamMeta) {
  return {
    ...meta,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    fairPlay: 0,
    yellowCards: 0,
    redCards: 0,
    position: 0,
  };
}

function applyMatchResult(
  stats: ReturnType<typeof initStats>,
  goalsFor: number,
  goalsAgainst: number,
) {
  stats.played += 1;
  stats.goalsFor += goalsFor;
  stats.goalsAgainst += goalsAgainst;
  stats.goalDifference = stats.goalsFor - stats.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    stats.won += 1;
    stats.points += 3;
  } else if (goalsFor === goalsAgainst) {
    stats.drawn += 1;
    stats.points += 1;
  } else {
    stats.lost += 1;
  }
}

function getHeadToHeadStats(
  teamIds: number[],
  matches: MatchWithEvents[],
): Map<number, ReturnType<typeof initStats>> {
  const map = new Map<number, ReturnType<typeof initStats>>();

  for (const id of teamIds) {
    map.set(id, {
      teamId: id,
      teamName: "",
      logoUrl: "",
      ownerUserId: null,
      ownerName: null,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      fairPlay: 0,
      yellowCards: 0,
      redCards: 0,
      position: 0,
    });
  }

  const idSet = new Set(teamIds);
  for (const match of matches) {
    if (!match.played || match.homeScore == null || match.awayScore == null) {
      continue;
    }
    if (!idSet.has(match.homeTeamId) || !idSet.has(match.awayTeamId)) {
      continue;
    }

    const home = map.get(match.homeTeamId)!;
    const away = map.get(match.awayTeamId)!;
    applyMatchResult(home, match.homeScore, match.awayScore);
    applyMatchResult(away, match.awayScore, match.homeScore);
  }

  return map;
}

function compareHeadToHead(
  a: ReturnType<typeof initStats>,
  b: ReturnType<typeof initStats>,
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) {
    return b.goalDifference - a.goalDifference;
  }
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return 0;
}

function compareTeams(
  a: ReturnType<typeof initStats>,
  b: ReturnType<typeof initStats>,
  tiedIds: number[],
  matches: MatchWithEvents[],
  seed: number,
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) {
    return b.goalDifference - a.goalDifference;
  }
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

  if (tiedIds.length >= 2) {
    const h2h = getHeadToHeadStats(tiedIds, matches);
    const ha = h2h.get(a.teamId);
    const hb = h2h.get(b.teamId);
    if (ha && hb) {
      const h2hCmp = compareHeadToHead(ha, hb);
      if (h2hCmp !== 0) return h2hCmp;
    }
  }

  if (b.fairPlay !== a.fairPlay) return b.fairPlay - a.fairPlay;

  const randomA = (a.teamId * seed) % 1000;
  const randomB = (b.teamId * seed) % 1000;
  return randomB - randomA;
}

export function calculateGroupStandings(
  teams: TeamMeta[],
  matches: MatchWithEvents[],
  tieBreakSeed = Math.random(),
): StandingRow[] {
  const statsMap = new Map<number, ReturnType<typeof initStats>>();

  for (const team of teams) {
    statsMap.set(team.teamId, initStats(team));
  }

  for (const match of matches) {
    if (!match.played || match.homeScore == null || match.awayScore == null) {
      continue;
    }

    const home = statsMap.get(match.homeTeamId);
    const away = statsMap.get(match.awayTeamId);
    if (!home || !away) continue;

    applyMatchResult(home, match.homeScore, match.awayScore);
    applyMatchResult(away, match.awayScore, match.homeScore);

    const homeCards = countMatchCards(match.events, match.homeTeamId);
    const awayCards = countMatchCards(match.events, match.awayTeamId);
    home.yellowCards += homeCards.yellow;
    home.redCards += homeCards.red;
    away.yellowCards += awayCards.yellow;
    away.redCards += awayCards.red;

    for (const event of match.events) {
      const target =
        event.teamId === match.homeTeamId ? home : away;
      if (target) {
        target.fairPlay += calculateFairPlayScore([{ type: event.type }]);
      }
    }
  }

  const rows = Array.from(statsMap.values());

  const sorted = [...rows].sort((a, b) => {
    const tiedAtPoints = rows.filter((r) => r.points === a.points);
    const tiedIds =
      tiedAtPoints.length > 1 && tiedAtPoints.some((t) => t.teamId === b.teamId)
        ? tiedAtPoints.map((t) => t.teamId)
        : [a.teamId, b.teamId];

    return compareTeams(a, b, tiedIds, matches, tieBreakSeed);
  });

  return sorted.map((row, index) => ({
    ...row,
    position: index + 1,
  }));
}

export type ThirdPlaceCandidate = StandingRow & {
  groupLetter: string;
};

export function rankThirdPlaces(
  candidates: ThirdPlaceCandidate[],
  tieBreakSeed = Math.random(),
): ThirdPlaceCandidate[] {
  return [...candidates].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.fairPlay !== a.fairPlay) return b.fairPlay - a.fairPlay;
    const randomA = (a.teamId * tieBreakSeed) % 1000;
    const randomB = (b.teamId * tieBreakSeed) % 1000;
    return randomB - randomA;
  });
}

export type GroupStandingsInput = {
  letter: string;
  teams: TeamMeta[];
  matches: MatchWithEvents[];
};

export type RankedThirdPlace = ThirdPlaceCandidate & {
  rankAmongThirds: number;
};

function collectStandingsByGroup(
  groups: GroupStandingsInput[],
  tieBreakSeed: number,
) {
  const firstAndSecond: number[] = [];
  const thirds: ThirdPlaceCandidate[] = [];

  for (const group of groups) {
    const standings = calculateGroupStandings(
      group.teams,
      group.matches,
      tieBreakSeed,
    );

    const first = standings[0];
    const second = standings[1];
    const third = standings[2];

    if (first) firstAndSecond.push(first.teamId);
    if (second) firstAndSecond.push(second.teamId);
    if (third) thirds.push({ ...third, groupLetter: group.letter });
  }

  return { firstAndSecond, thirds };
}

/** Ranking dos 3º colocados e quantos avançam (mesma regra do mata-mata). */
export function getThirdPlaceStandings(
  groups: GroupStandingsInput[],
  tieBreakSeed = Math.random(),
): { ranked: RankedThirdPlace[]; qualifyingCount: number } {
  const { firstAndSecond, thirds } = collectStandingsByGroup(
    groups,
    tieBreakSeed,
  );
  const qualifyingCount = Math.max(0, 32 - firstAndSecond.length);

  const ranked = rankThirdPlaces(thirds, tieBreakSeed).map((row, index) => ({
    ...row,
    rankAmongThirds: index + 1,
  }));

  return { ranked, qualifyingCount };
}

/** IDs das seleções classificadas no momento (mesma regra do mata-mata). */
export function getCurrentQualifiedTeamIds(
  groups: GroupStandingsInput[],
  tieBreakSeed = Math.random(),
): Set<number> {
  const { firstAndSecond, thirds } = collectStandingsByGroup(
    groups,
    tieBreakSeed,
  );
  const bestThirdsCount = Math.max(0, 32 - firstAndSecond.length);
  const bestThirds =
    bestThirdsCount > 0
      ? rankThirdPlaces(thirds, tieBreakSeed).slice(0, bestThirdsCount)
      : [];

  return new Set([
    ...firstAndSecond,
    ...bestThirds.map((t) => t.teamId),
  ]);
}
