import {
  calculateGroupStandings,
  getThirdPlaceStandings,
  type GroupStandingsInput,
} from "@/_services/standings.service";
import {
  bracketSideLabel,
  R32_BRACKET_48,
  type BracketSlotSide,
} from "@/_utils/knockout-bracket";

export type SimulatedKnockoutSide = {
  teamId: number;
  teamName: string;
  logoUrl: string;
  ownerName: string | null;
  label: string;
};

export type SimulatedKnockoutMatch = {
  slot: number;
  home: SimulatedKnockoutSide | null;
  away: SimulatedKnockoutSide | null;
  ownerConflict: boolean;
};

function resolveGroupSide(
  side: Extract<BracketSlotSide, { kind: "group" }>,
  groups: GroupStandingsInput[],
  tieBreakSeed: number,
): SimulatedKnockoutSide | null {
  const group = groups.find((g) => g.letter === side.group);
  if (!group) return null;

  const standings = calculateGroupStandings(
    group.teams,
    group.matches,
    tieBreakSeed,
  );
  const row = standings[side.position - 1];
  if (!row) return null;

  return {
    teamId: row.teamId,
    teamName: row.teamName,
    logoUrl: row.logoUrl,
    ownerName: row.ownerName,
    label: bracketSideLabel(side),
  };
}

function resolveThirdSide(
  side: Extract<BracketSlotSide, { kind: "third" }>,
  rankedThirds: ReturnType<typeof getThirdPlaceStandings>["ranked"],
  qualifyingCount: number,
  usedThirdTeamIds: Set<number>,
): SimulatedKnockoutSide | null {
  const label = bracketSideLabel(side);
  const candidate = rankedThirds
    .filter(
      (row) =>
        row.rankAmongThirds <= qualifyingCount &&
        side.groups.includes(row.groupLetter) &&
        !usedThirdTeamIds.has(row.teamId),
    )
    .sort((a, b) => a.rankAmongThirds - b.rankAmongThirds)[0];

  if (!candidate) return null;

  usedThirdTeamIds.add(candidate.teamId);

  return {
    teamId: candidate.teamId,
    teamName: candidate.teamName,
    logoUrl: candidate.logoUrl,
    ownerName: candidate.ownerName,
    label,
  };
}

function resolveSide(
  side: BracketSlotSide,
  groups: GroupStandingsInput[],
  rankedThirds: ReturnType<typeof getThirdPlaceStandings>["ranked"],
  qualifyingCount: number,
  usedThirdTeamIds: Set<number>,
  tieBreakSeed: number,
): SimulatedKnockoutSide | null {
  if (side.kind === "group") {
    return resolveGroupSide(side, groups, tieBreakSeed);
  }
  return resolveThirdSide(
    side,
    rankedThirds,
    qualifyingCount,
    usedThirdTeamIds,
  );
}

function ownerUserIdForTeam(
  groups: GroupStandingsInput[],
  teamId: number,
): string | null {
  for (const group of groups) {
    const team = group.teams.find((t) => t.teamId === teamId);
    if (team) return team.ownerUserId;
  }
  return null;
}

/** Simula os 16-avos com a classificação atual (sem persistir). */
export function simulateR32Matches(
  groups: GroupStandingsInput[],
  tieBreakSeed: number,
): SimulatedKnockoutMatch[] {
  const { ranked: rankedThirds, qualifyingCount } = getThirdPlaceStandings(
    groups,
    tieBreakSeed,
  );
  const usedThirdTeamIds = new Set<number>();

  return R32_BRACKET_48.map((definition, slot) => {
    const home = resolveSide(
      definition.home,
      groups,
      rankedThirds,
      qualifyingCount,
      usedThirdTeamIds,
      tieBreakSeed,
    );
    const away = resolveSide(
      definition.away,
      groups,
      rankedThirds,
      qualifyingCount,
      usedThirdTeamIds,
      tieBreakSeed,
    );

    const ownerConflict =
      home != null &&
      away != null &&
      ownerUserIdForTeam(groups, home.teamId) != null &&
      ownerUserIdForTeam(groups, home.teamId) ===
        ownerUserIdForTeam(groups, away.teamId);

    return {
      slot,
      home,
      away,
      ownerConflict,
    };
  });
}
