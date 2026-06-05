import prisma from "@/_lib/prisma";
import {
  initializeChampionshipStructure,
  type GroupAssignmentInput,
} from "@/_services/team-assignment.service";
import type { ChampStatus, SelectionMode } from "@/generated/prisma/client";

export async function createChampionship(input: {
  name: string;
  season?: number;
  selectionMode: SelectionMode;
  createdById: string;
  participantIds: string[];
  groupAssignments: GroupAssignmentInput[];
}) {
  const championship = await prisma.$transaction(async (tx) => {
    const created = await tx.championship.create({
      data: {
        name: input.name,
        season: input.season ?? 2026,
        selectionMode: input.selectionMode,
        status: "SETUP",
        createdById: input.createdById,
        participants: {
          create: input.participantIds.map((userId) => ({ userId })),
        },
      },
    });

    await initializeChampionshipStructure(
      created.id,
      input.groupAssignments,
      tx,
    );

    return created;
  });

  return prisma.championship.findUniqueOrThrow({
    where: { id: championship.id },
    include: {
      participants: { include: { user: true } },
      groups: { include: { teams: { include: { team: true, owner: true } } } },
      matches: true,
    },
  });
}

export async function startGroupPhase(championshipId: string) {
  const unassigned = await prisma.championshipTeam.count({
    where: { championshipId, ownerUserId: null },
  });

  if (unassigned > 0) {
    throw new Error("Todos os times precisam ter dono antes de iniciar.");
  }

  return prisma.championship.update({
    where: { id: championshipId },
    data: { status: "GROUPS", tieBreakSeed: Math.random() },
  });
}

const championshipDetailInclude = {
  groups: {
    orderBy: { letter: "asc" as const },
    include: {
      teams: { include: { team: true, owner: true } },
      matches: {
        include: { events: true },
        orderBy: { roundNumber: "asc" as const },
      },
    },
  },
  participants: { include: { user: true } },
  matches: {
    include: { events: true },
    orderBy: [{ stage: "asc" as const }, { bracketSlot: "asc" as const }],
  },
};

export async function listPublicChampionships() {
  return prisma.championship.findMany({
    where: { status: { not: "SETUP" } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { participants: true, matches: true } },
    },
  });
}

export async function getPublicChampionship(championshipId: string) {
  return prisma.championship.findFirst({
    where: {
      id: championshipId,
      status: { not: "SETUP" },
    },
    include: championshipDetailInclude,
  });
}

export async function getChampionshipForView(
  championshipId: string,
  userId?: string | null,
) {
  if (userId) {
    const asParticipant = await getChampionshipForUser(championshipId, userId);
    if (asParticipant) return asParticipant;

    const asCreator = await prisma.championship.findFirst({
      where: { id: championshipId, createdById: userId },
      include: championshipDetailInclude,
    });
    if (asCreator) return asCreator;
  }
  return getPublicChampionship(championshipId);
}

export async function listChampionshipsForHome(userId?: string | null) {
  if (userId) {
    const mine = await listChampionshipsForUser(userId);
    if (mine.length > 0) return mine;
  }
  return listPublicChampionships();
}

export async function getChampionshipForUser(
  championshipId: string,
  userId: string,
) {
  const participant = await prisma.championshipParticipant.findUnique({
    where: {
      championshipId_userId: { championshipId, userId },
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!participant && user?.role !== "ADMIN") {
    return null;
  }

  return prisma.championship.findUnique({
    where: { id: championshipId },
    include: championshipDetailInclude,
  });
}

export async function listChampionshipsForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user?.role === "ADMIN") {
    return prisma.championship.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { participants: true, matches: true } },
      },
    });
  }

  return prisma.championship.findMany({
    where: {
      participants: { some: { userId } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { participants: true, matches: true } },
    },
  });
}

export async function updateChampionshipStatus(
  championshipId: string,
  status: ChampStatus,
) {
  return prisma.championship.update({
    where: { id: championshipId },
    data: { status },
  });
}
