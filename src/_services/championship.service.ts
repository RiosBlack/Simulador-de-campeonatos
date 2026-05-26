import prisma from "@/_lib/prisma";
import { initializeChampionshipStructure } from "@/_services/team-assignment.service";
import type { ChampStatus, SelectionMode } from "@/generated/prisma/client";

export async function createChampionship(input: {
  name: string;
  season?: number;
  selectionMode: SelectionMode;
  createdById: string;
  participantIds: string[];
  teamIds: number[];
}) {
  const championship = await prisma.championship.create({
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

  await initializeChampionshipStructure(championship.id, input.teamIds);

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
    include: {
      groups: {
        orderBy: { letter: "asc" },
        include: {
          teams: { include: { team: true, owner: true } },
          matches: {
            include: { events: true },
            orderBy: { roundNumber: "asc" },
          },
        },
      },
      participants: { include: { user: true } },
      matches: {
        orderBy: [{ stage: "asc" }, { bracketSlot: "asc" }],
      },
    },
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
