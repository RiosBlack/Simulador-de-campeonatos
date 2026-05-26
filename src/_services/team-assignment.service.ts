import prisma from "@/_lib/prisma";
import type { SelectionMode } from "@/generated/prisma/client";

export class AssignmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssignmentError";
  }
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function validateOneTeamPerGroup(
  championshipId: string,
  userId: string,
  groupId: string,
  excludeChampionshipTeamId?: string,
) {
  const existing = await prisma.championshipTeam.findFirst({
    where: {
      championshipId,
      ownerUserId: userId,
      groupId,
      ...(excludeChampionshipTeamId
        ? { id: { not: excludeChampionshipTeamId } }
        : {}),
    },
  });

  if (existing) {
    throw new AssignmentError(
      "Cada usuário só pode ter 1 time por grupo nesta copa.",
    );
  }
}

export async function assignTeamManually(
  championshipTeamId: string,
  ownerUserId: string,
) {
  const ct = await prisma.championshipTeam.findUniqueOrThrow({
    where: { id: championshipTeamId },
    include: { championship: true },
  });

  if (ct.championship.status !== "SETUP") {
    throw new AssignmentError("Copa já iniciada — não é possível alterar donos.");
  }

  const isParticipant = await prisma.championshipParticipant.findUnique({
    where: {
      championshipId_userId: {
        championshipId: ct.championshipId,
        userId: ownerUserId,
      },
    },
  });

  if (!isParticipant) {
    throw new AssignmentError("Usuário não participa desta copa.");
  }

  await validateOneTeamPerGroup(
    ct.championshipId,
    ownerUserId,
    ct.groupId,
    championshipTeamId,
  );

  return prisma.championshipTeam.update({
    where: { id: championshipTeamId },
    data: { ownerUserId },
    include: { team: true, owner: true, group: true },
  });
}

export async function runDrawAssignment(championshipId: string) {
  const championship = await prisma.championship.findUniqueOrThrow({
    where: { id: championshipId },
    include: {
      participants: true,
      groups: {
        include: { teams: true },
        orderBy: { letter: "asc" },
      },
    },
  });

  if (championship.selectionMode !== "DRAW") {
    throw new AssignmentError("Esta copa não está no modo sorteio.");
  }

  if (championship.participants.length === 0) {
    throw new AssignmentError("Adicione participantes antes do sorteio.");
  }

  const participantIds = championship.participants.map((p) => p.userId);
  const ownerByGroup = new Map<string, Set<string>>();
  const updates: Array<{ id: string; ownerUserId: string }> = [];

  for (const group of championship.groups) {
    ownerByGroup.set(group.id, new Set());
    const teams = shuffle(group.teams);

    for (const team of teams) {
      const usedInGroup = ownerByGroup.get(group.id)!;
      const candidates = shuffle(
        participantIds.filter((uid) => !usedInGroup.has(uid)),
      );

      if (candidates.length === 0) {
        throw new AssignmentError(
          `Participantes insuficientes para o grupo ${group.letter}.`,
        );
      }

      const ownerId = candidates[0]!;
      usedInGroup.add(ownerId);
      updates.push({ id: team.id, ownerUserId: ownerId });
    }
  }

  await prisma.$transaction(
    updates.map((u) =>
      prisma.championshipTeam.update({
        where: { id: u.id },
        data: { ownerUserId: u.ownerUserId },
      }),
    ),
  );

  return prisma.championshipTeam.findMany({
    where: { championshipId },
    include: { team: true, owner: true, group: true },
  });
}

export async function initializeChampionshipStructure(
  championshipId: string,
  teamIds: number[],
) {
  if (![32, 48].includes(teamIds.length)) {
    throw new AssignmentError(
      "É necessário ter 32 ou 48 seleções para montar os grupos.",
    );
  }

  const groupCount = teamIds.length / 4;
  const letters = "ABCDEFGHIJKL".split("").slice(0, groupCount);
  const shuffled = shuffle(teamIds);
  const groups = letters.map((letter) => ({
    id: crypto.randomUUID(),
    championshipId,
    letter,
  }));

  const championshipTeams: Array<{
    championshipId: string;
    groupId: string;
    teamId: number;
  }> = [];

  let index = 0;
  for (const group of groups) {
    for (let i = 0; i < 4; i++) {
      championshipTeams.push({
        championshipId,
        groupId: group.id,
        teamId: shuffled[index++]!,
      });
    }
  }

  const roundRobinPairs = [
    [0, 1],
    [2, 3],
    [0, 2],
    [1, 3],
    [0, 3],
    [1, 2],
  ];

  const matches: Array<{
    championshipId: string;
    stage: "GROUP";
    groupId: string;
    roundNumber: number;
    homeTeamId: number;
    awayTeamId: number;
  }> = [];

  for (const group of groups) {
    const ids = championshipTeams
      .filter((t) => t.groupId === group.id)
      .map((t) => t.teamId);
    let roundNum = 1;
    for (const [hi, ai] of roundRobinPairs) {
      matches.push({
        championshipId,
        stage: "GROUP",
        groupId: group.id,
        roundNumber: roundNum++,
        homeTeamId: ids[hi]!,
        awayTeamId: ids[ai]!,
      });
    }
  }

  await prisma.$transaction([
    prisma.group.createMany({ data: groups }),
    prisma.championshipTeam.createMany({ data: championshipTeams }),
    prisma.match.createMany({ data: matches }),
  ]);
}

export async function setChampionshipMode(
  championshipId: string,
  mode: SelectionMode,
) {
  return prisma.championship.update({
    where: { id: championshipId },
    data: { selectionMode: mode },
  });
}
