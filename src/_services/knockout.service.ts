import prisma from "@/_lib/prisma";
import {
  calculateGroupStandings,
  rankThirdPlaces,
  type StandingRow,
  type ThirdPlaceCandidate,
} from "@/_services/standings.service";
import type { MatchStage } from "@/generated/prisma/client";

type QualifiedTeam = {
  teamId: number;
  groupLetter: string;
  position: number;
  ownerUserId: string | null;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function pickStandIn(
  championshipId: string,
  excludeUserId: string,
): Promise<string> {
  const participants = await prisma.championshipParticipant.findMany({
    where: { championshipId, userId: { not: excludeUserId } },
  });

  if (participants.length === 0) {
    throw new Error("Não há participantes para assumir o confronto.");
  }

  const picked = shuffle(participants)[0]!;
  return picked.userId;
}

async function resolveOwnersConflict(
  championshipId: string,
  homeOwnerId: string | null,
  awayOwnerId: string | null,
): Promise<{ homeStandIn?: string; awayStandIn?: string }> {
  if (!homeOwnerId || !awayOwnerId || homeOwnerId !== awayOwnerId) {
    return {};
  }

  const standIn = await pickStandIn(championshipId, homeOwnerId);
  const assignToHome = Math.random() < 0.5;

  if (assignToHome) {
    return { homeStandIn: standIn };
  }
  return { awayStandIn: standIn };
}

export async function getQualifiedTeams(
  championshipId: string,
): Promise<QualifiedTeam[]> {
  const championship = await prisma.championship.findUniqueOrThrow({
    where: { id: championshipId },
    include: {
      groups: {
        include: {
          teams: { include: { team: true, owner: true } },
          matches: { include: { events: true } },
        },
      },
    },
  });

  const firstAndSecond: QualifiedTeam[] = [];
  const thirds: ThirdPlaceCandidate[] = [];

  for (const group of championship.groups) {
    const standings = calculateGroupStandings(
      group.teams.map((t) => ({
        teamId: t.teamId,
        teamName: t.team.name,
        logoUrl: t.team.logoUrl,
        ownerUserId: t.ownerUserId,
        ownerName: t.owner?.name ?? null,
      })),
      group.matches,
      championship.tieBreakSeed ?? Math.random(),
    );

    const first = standings[0];
    const second = standings[1];
    const third = standings[2];

    if (first) {
      firstAndSecond.push({
        teamId: first.teamId,
        groupLetter: group.letter,
        position: 1,
        ownerUserId: first.ownerUserId,
      });
    }
    if (second) {
      firstAndSecond.push({
        teamId: second.teamId,
        groupLetter: group.letter,
        position: 2,
        ownerUserId: second.ownerUserId,
      });
    }
    if (third) {
      thirds.push({ ...third, groupLetter: group.letter });
    }
  }

  const bestThirdsCount = Math.max(0, 32 - firstAndSecond.length);
  const bestThirds =
    bestThirdsCount > 0
      ? rankThirdPlaces(thirds, championship.tieBreakSeed ?? Math.random()).slice(
          0,
          bestThirdsCount,
        )
      : [];

  return [
    ...firstAndSecond,
    ...bestThirds.map((t) => ({
      teamId: t.teamId,
      groupLetter: t.groupLetter,
      position: 3,
      ownerUserId: t.ownerUserId,
    })),
  ];
}

export async function generateInitialKnockout(championshipId: string) {
  const qualified = await getQualifiedTeams(championshipId);

  if (qualified.length < 16) {
    throw new Error(
      "Aguarde todos os jogos da fase de grupos para gerar o mata-mata.",
    );
  }

  const initialStage: MatchStage = qualified.length >= 32 ? "R32" : "R16";
  const ordered = shuffle(qualified).slice(0, initialStage === "R32" ? 32 : 16);
  const pairs: Array<[QualifiedTeam, QualifiedTeam]> = [];

  for (let i = 0; i < ordered.length; i += 2) {
    pairs.push([ordered[i]!, ordered[i + 1]!]);
  }

  await prisma.$transaction(async (tx) => {
    let slot = 0;
    for (const [home, away] of pairs) {
      const conflict = await resolveOwnersConflict(
        championshipId,
        home.ownerUserId,
        away.ownerUserId,
      );

      await tx.match.create({
        data: {
          championshipId,
          stage: initialStage,
          bracketSlot: slot++,
          homeTeamId: home.teamId,
          awayTeamId: away.teamId,
          homeStandInUserId: conflict.homeStandIn,
          awayStandInUserId: conflict.awayStandIn,
        },
      });
    }

    await tx.championship.update({
      where: { id: championshipId },
      data: { status: "KNOCKOUT" },
    });
  });
}

export async function advanceKnockoutRound(
  championshipId: string,
  fromStage: MatchStage,
  toStage: MatchStage,
) {
  const played = await prisma.match.findMany({
    where: { championshipId, stage: fromStage, played: true },
    orderBy: { bracketSlot: "asc" },
  });

  if (played.length === 0) return;

  const winners: Array<{
    teamId: number;
    ownerUserId: string | null;
  }> = [];

  for (const match of played) {
    const home = match.homeScore ?? 0;
    const away = match.awayScore ?? 0;
    let winnerId = match.homeTeamId;
    let winnerOwner = await getOwner(championshipId, match.homeTeamId);

    if (away > home) {
      winnerId = match.awayTeamId;
      winnerOwner = await getOwner(championshipId, match.awayTeamId);
    } else if (home === away) {
      const penHome = match.homeScorePen ?? 0;
      const penAway = match.awayScorePen ?? 0;
      if (penAway > penHome) {
        winnerId = match.awayTeamId;
        winnerOwner = await getOwner(championshipId, match.awayTeamId);
      }
    }

    winners.push({ teamId: winnerId, ownerUserId: winnerOwner });
  }

  const pairs: Array<[typeof winners[0], typeof winners[0]]> = [];
  for (let i = 0; i < winners.length; i += 2) {
    if (winners[i + 1]) {
      pairs.push([winners[i]!, winners[i + 1]!]);
    }
  }

  let slot = 0;
  for (const [home, away] of pairs) {
    const conflict = await resolveOwnersConflict(
      championshipId,
      home.ownerUserId,
      away.ownerUserId,
    );

    await prisma.match.create({
      data: {
        championshipId,
        stage: toStage,
        bracketSlot: slot++,
        homeTeamId: home.teamId,
        awayTeamId: away.teamId,
        homeStandInUserId: conflict.homeStandIn,
        awayStandInUserId: conflict.awayStandIn,
      },
    });
  }
}

async function getOwner(
  championshipId: string,
  teamId: number,
): Promise<string | null> {
  const ct = await prisma.championshipTeam.findFirst({
    where: { championshipId, teamId },
  });
  return ct?.ownerUserId ?? null;
}

export async function checkAndAdvanceAfterMatch(championshipId: string) {
  const groupTotal = await prisma.match.count({
    where: { championshipId, stage: "GROUP" },
  });
  const groupPlayed = await prisma.match.count({
    where: { championshipId, stage: "GROUP", played: true },
  });

  const champ = await prisma.championship.findUnique({
    where: { id: championshipId },
  });

  if (
    champ?.status === "GROUPS" &&
    groupTotal > 0 &&
    groupPlayed === groupTotal
  ) {
    const existingInitial = await prisma.match.count({
      where: { championshipId, stage: { in: ["R32", "R16"] } },
    });
    if (existingInitial === 0) {
      await generateInitialKnockout(championshipId);
    }
  }

  const stages: Array<[MatchStage, MatchStage]> = [
    ["R32", "R16"],
    ["R16", "QF"],
    ["QF", "SF"],
    ["SF", "FINAL"],
  ];

  for (const [from, to] of stages) {
    const total = await prisma.match.count({
      where: { championshipId, stage: from },
    });
    const done = await prisma.match.count({
      where: { championshipId, stage: from, played: true },
    });
    const nextExists = await prisma.match.count({
      where: { championshipId, stage: to },
    });

    if (total > 0 && done === total && nextExists === 0) {
      await advanceKnockoutRound(championshipId, from, to);
    }
  }
}
