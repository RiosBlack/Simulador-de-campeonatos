"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAdmin } from "@/_lib/session";
import { auth } from "@/_lib/auth";
import { createChampionship, startGroupPhase } from "@/_services/championship.service";
import {
  assignTeamManually,
  runDrawAssignment,
} from "@/_services/team-assignment.service";
import { checkAndAdvanceAfterMatch } from "@/_services/knockout.service";
import type { CardType } from "@/generated/prisma/client";

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "MEMBER"]),
});

const createChampSchema = z.object({
  name: z.string().min(3).max(120),
  selectionMode: z.enum(["DRAW", "MANUAL"]),
  participantIds: z.array(z.string()).min(1),
});

const matchResultSchema = z.object({
  matchId: z.string(),
  homeScore: z.coerce.number().min(0).max(99),
  awayScore: z.coerce.number().min(0).max(99),
  homeScorePen: z.coerce.number().min(0).max(99).optional(),
  awayScorePen: z.coerce.number().min(0).max(99).optional(),
  yellowHome: z.coerce.number().min(0).default(0),
  yellowAway: z.coerce.number().min(0).default(0),
  redHome: z.coerce.number().min(0).default(0),
  redAway: z.coerce.number().min(0).default(0),
});

export async function createUserAction(formData: FormData) {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return { error: "E-mail já cadastrado." };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
      },
    });

    await prisma.user.update({
      where: { email: parsed.data.email },
      data: { role: parsed.data.role },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "Não foi possível criar o usuário." };
  }
}

export async function toggleUserRoleAction(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const newRole = user.role === "ADMIN" ? "MEMBER" : "ADMIN";

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath("/admin/users");
  return { success: true, role: newRole };
}

export async function createChampionshipAction(formData: FormData) {
  const session = await requireAdmin();

  const participantIds = formData.getAll("participantIds") as string[];
  const parsed = createChampSchema.safeParse({
    name: formData.get("name"),
    selectionMode: formData.get("selectionMode"),
    participantIds,
  });

  if (!parsed.success) {
    return { error: "Dados da copa inválidos." };
  }

  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  if (teams.length < 32) {
    return {
      error:
        "Sincronize pelo menos 32 seleções da API-Football antes de criar a copa.",
    };
  }

  const usableCount = teams.length >= 48 ? 48 : 32;
  const teamIds = teams.slice(0, usableCount).map((t) => t.id);

  const championship = await createChampionship({
    name: parsed.data.name,
    selectionMode: parsed.data.selectionMode,
    createdById: session.user.id,
    participantIds: parsed.data.participantIds,
    teamIds,
  });

  revalidatePath("/admin/championships");
  return { success: true, id: championship.id };
}

export async function runDrawAction(championshipId: string) {
  await requireAdmin();
  try {
    await runDrawAssignment(championshipId);
    revalidatePath(`/admin/championships/${championshipId}/teams`);
    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Erro no sorteio",
    };
  }
}

export async function assignTeamAction(
  championshipTeamId: string,
  ownerUserId: string,
) {
  await requireAdmin();
  try {
    await assignTeamManually(championshipTeamId, ownerUserId);
    revalidatePath("/admin/championships");
    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Erro na atribuição",
    };
  }
}

export async function startGroupsAction(championshipId: string) {
  await requireAdmin();
  try {
    await startGroupPhase(championshipId);
    revalidatePath(`/admin/championships/${championshipId}/matches`);
    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Erro ao iniciar fase de grupos",
    };
  }
}

function buildCardEvents(
  teamId: number,
  yellow: number,
  red: number,
): Array<{ teamId: number; type: CardType }> {
  const events: Array<{ teamId: number; type: CardType }> = [];
  for (let i = 0; i < yellow; i++) {
    events.push({ teamId, type: "YELLOW" });
  }
  for (let i = 0; i < red; i++) {
    events.push({ teamId, type: "DIRECT_RED" });
  }
  return events;
}

export async function saveMatchResultAction(formData: FormData) {
  await requireAdmin();

  const parsed = matchResultSchema.safeParse({
    matchId: formData.get("matchId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
    homeScorePen: formData.get("homeScorePen") || undefined,
    awayScorePen: formData.get("awayScorePen") || undefined,
    yellowHome: formData.get("yellowHome"),
    yellowAway: formData.get("yellowAway"),
    redHome: formData.get("redHome"),
    redAway: formData.get("redAway"),
  });

  if (!parsed.success) {
    return { error: "Resultado inválido." };
  }

  const match = await prisma.match.findUniqueOrThrow({
    where: { id: parsed.data.matchId },
  });

  await prisma.$transaction(async (tx) => {
    await tx.matchEvent.deleteMany({ where: { matchId: match.id } });

    const homeEvents = buildCardEvents(
      match.homeTeamId,
      parsed.data.yellowHome,
      parsed.data.redHome,
    );
    const awayEvents = buildCardEvents(
      match.awayTeamId,
      parsed.data.yellowAway,
      parsed.data.redAway,
    );

    await tx.matchEvent.createMany({
      data: [...homeEvents, ...awayEvents].map((e) => ({
        matchId: match.id,
        teamId: e.teamId,
        type: e.type,
      })),
    });

    await tx.match.update({
      where: { id: match.id },
      data: {
        homeScore: parsed.data.homeScore,
        awayScore: parsed.data.awayScore,
        homeScorePen: parsed.data.homeScorePen ?? null,
        awayScorePen: parsed.data.awayScorePen ?? null,
        played: true,
      },
    });
  });

  await checkAndAdvanceAfterMatch(match.championshipId);

  revalidatePath(`/admin/championships/${match.championshipId}/matches`);
  revalidatePath(`/championships/${match.championshipId}/groups`);
  revalidatePath(`/championships/${match.championshipId}/knockout`);

  return { success: true };
}

export async function syncTeamsAction() {
  await requireAdmin();
  const { fetchWorldCupTeams } = await import("@/_lib/api-football");
  const teams = await fetchWorldCupTeams(2026, 1);

  await prisma.$transaction(
    teams.map((team) =>
      prisma.team.upsert({
        where: { id: team.id },
        create: team,
        update: { ...team, syncedAt: new Date() },
      }),
    ),
  );

  revalidatePath("/admin/championships");
  return { success: true, count: teams.length };
}
