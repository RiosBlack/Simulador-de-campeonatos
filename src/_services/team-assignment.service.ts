import prisma from "@/_lib/prisma";
import type { Prisma, SelectionMode } from "@/generated/prisma/client";

type DbClient = Prisma.TransactionClient | typeof prisma;

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

const OWNER_UPDATE_BATCH = 12;

async function batchUpdateTeamOwners(
  updates: Array<{ id: string; ownerUserId: string }>,
) {
  for (let i = 0; i < updates.length; i += OWNER_UPDATE_BATCH) {
    const batch = updates.slice(i, i + OWNER_UPDATE_BATCH);
    await Promise.all(
      batch.map((u) =>
        prisma.championshipTeam.update({
          where: { id: u.id },
          data: { ownerUserId: u.ownerUserId },
        }),
      ),
    );
  }
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

export async function assignOwnersBulk(
  championshipId: string,
  assignments: Array<{
    groupLetter: string;
    teamId: number;
    ownerUserId: string;
  }>,
) {
  const championship = await prisma.championship.findUniqueOrThrow({
    where: { id: championshipId },
  });

  if (championship.status !== "SETUP") {
    throw new AssignmentError("Copa já iniciada — não é possível alterar donos.");
  }

  const participantSet = new Set(
    (
      await prisma.championshipParticipant.findMany({
        where: { championshipId },
        select: { userId: true },
      })
    ).map((p) => p.userId),
  );

  const championshipTeams = await prisma.championshipTeam.findMany({
    where: { championshipId },
    include: { group: true },
  });

  const bySlot = new Map(
    championshipTeams.map(
      (t) => [`${t.group.letter}:${t.teamId}`, t] as const,
    ),
  );

  const ownersByGroup = new Map<string, Set<string>>();
  const updates: Array<{ id: string; ownerUserId: string }> = [];

  for (const assignment of assignments) {
    if (!participantSet.has(assignment.ownerUserId)) {
      throw new AssignmentError("Usuário não participa desta copa.");
    }

    const ct = bySlot.get(`${assignment.groupLetter}:${assignment.teamId}`);
    if (!ct) {
      throw new AssignmentError(
        `Seleção não encontrada no grupo ${assignment.groupLetter}.`,
      );
    }

    const usedInGroup = ownersByGroup.get(ct.groupId) ?? new Set();
    if (usedInGroup.has(assignment.ownerUserId)) {
      throw new AssignmentError(
        "Cada usuário só pode ter 1 time por grupo nesta copa.",
      );
    }
    usedInGroup.add(assignment.ownerUserId);
    ownersByGroup.set(ct.groupId, usedInGroup);

    updates.push({ id: ct.id, ownerUserId: assignment.ownerUserId });
  }

  await batchUpdateTeamOwners(updates);
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

  await batchUpdateTeamOwners(updates);

  return prisma.championshipTeam.findMany({
    where: { championshipId },
    include: { team: true, owner: true, group: true },
  });
}

export type GroupAssignmentInput = {
  letter: string;
  teamIds: [number, number, number, number];
};

const ROUND_ROBIN_PAIRS: Array<[number, number]> = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
];

export function buildGroupStageMatches(
  championshipId: string,
  groupId: string,
  teamIds: [number, number, number, number],
): Array<{
  championshipId: string;
  stage: "GROUP";
  groupId: string;
  roundNumber: number;
  homeTeamId: number;
  awayTeamId: number;
}> {
  const matches: Array<{
    championshipId: string;
    stage: "GROUP";
    groupId: string;
    roundNumber: number;
    homeTeamId: number;
    awayTeamId: number;
  }> = [];

  let roundNum = 1;
  for (const [hi, ai] of ROUND_ROBIN_PAIRS) {
    matches.push({
      championshipId,
      stage: "GROUP",
      groupId,
      roundNumber: roundNum++,
      homeTeamId: teamIds[hi]!,
      awayTeamId: teamIds[ai]!,
    });
  }

  return matches;
}

/** Cria jogos da fase de grupos se a copa ainda não tiver nenhum (ex.: copas antigas). */
export async function ensureGroupStageMatches(championshipId: string) {
  const existing = await prisma.match.count({
    where: { championshipId, stage: "GROUP" },
  });
  if (existing > 0) return existing;

  const groups = await prisma.group.findMany({
    where: { championshipId },
    orderBy: { letter: "asc" },
    include: {
      teams: { orderBy: { teamId: "asc" } },
    },
  });

  if (groups.length === 0) return 0;

  const matches = groups.flatMap((group) => {
    if (group.teams.length !== 4) return [];
    const teamIds = group.teams.map((t) => t.teamId) as [
      number,
      number,
      number,
      number,
    ];
    return buildGroupStageMatches(championshipId, group.id, teamIds);
  });

  if (matches.length === 0) return 0;

  await prisma.match.createMany({ data: matches });
  return matches.length;
}

export async function initializeChampionshipStructure(
  championshipId: string,
  groupAssignments: GroupAssignmentInput[],
  db: DbClient = prisma,
) {
  const teamCount = groupAssignments.length * 4;
  if (![32, 48].includes(teamCount)) {
    throw new AssignmentError(
      "É necessário ter 32 ou 48 seleções para montar os grupos.",
    );
  }

  if (![8, 12].includes(groupAssignments.length)) {
    throw new AssignmentError("Quantidade de grupos inválida.");
  }

  const allTeamIds = groupAssignments.flatMap((g) => g.teamIds);
  if (new Set(allTeamIds).size !== allTeamIds.length) {
    throw new AssignmentError("Cada seleção só pode aparecer uma vez na copa.");
  }

  const sorted = [...groupAssignments].sort((a, b) =>
    a.letter.localeCompare(b.letter),
  );

  const groups = sorted.map((g) => ({
    id: crypto.randomUUID(),
    championshipId,
    letter: g.letter,
  }));

  const letterToGroupId = new Map(
    sorted.map((g, i) => [g.letter, groups[i]!.id] as const),
  );

  const championshipTeams: Array<{
    championshipId: string;
    groupId: string;
    teamId: number;
  }> = [];

  for (const assignment of sorted) {
    const groupId = letterToGroupId.get(assignment.letter)!;
    for (const teamId of assignment.teamIds) {
      championshipTeams.push({
        championshipId,
        groupId,
        teamId,
      });
    }
  }

  const matches = groups.flatMap((group) => {
    const ids = championshipTeams
      .filter((t) => t.groupId === group.id)
      .map((t) => t.teamId) as [number, number, number, number];
    return buildGroupStageMatches(championshipId, group.id, ids);
  });

  await db.group.createMany({ data: groups });
  await db.championshipTeam.createMany({ data: championshipTeams });
  await db.match.createMany({ data: matches });
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
