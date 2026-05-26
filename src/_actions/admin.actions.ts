"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAdmin } from "@/_lib/session";
import { auth } from "@/_lib/auth";
import { createChampionship, startGroupPhase } from "@/_services/championship.service";
import {
  assignOwnersBulk,
  assignTeamManually,
  runDrawAssignment,
} from "@/_services/team-assignment.service";
import {
  assertMatchReadyForResult,
  checkAndAdvanceAfterMatch,
} from "@/_services/knockout.service";
import { upsertTeamsCatalog } from "@/_services/team-catalog.service";
import type { CardType } from "@/generated/prisma/client";

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "MEMBER"]),
});

const GROUP_LETTERS_32 = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
const GROUP_LETTERS_48 = [
  ...GROUP_LETTERS_32,
  "I",
  "J",
  "K",
  "L",
] as const;

const groupAssignmentEntrySchema = z.object({
  letter: z.string().length(1),
  teamId: z.coerce.number().int().positive(),
});

const createChampSchema = z
  .object({
    name: z.string().min(3).max(120),
    selectionMode: z.enum(["DRAW", "MANUAL"]),
    participantIds: z.array(z.string()).min(1),
    formatSize: z.enum(["32", "48"]),
    groupAssignments: z.array(groupAssignmentEntrySchema),
  })
  .superRefine((data, ctx) => {
    const expectedGroups = data.formatSize === "48" ? 12 : 8;
    const expectedTeams = data.formatSize === "48" ? 48 : 32;
    const allowedLetters: readonly string[] =
      data.formatSize === "48" ? GROUP_LETTERS_48 : GROUP_LETTERS_32;
    const allowedSet = new Set(allowedLetters);

    if (data.groupAssignments.length !== expectedTeams) {
      ctx.addIssue({
        code: "custom",
        message: `Informe exatamente ${expectedTeams} seleções nos grupos.`,
        path: ["groupAssignments"],
      });
      return;
    }

    const byLetter = new Map<string, number[]>();
    for (const entry of data.groupAssignments) {
      if (!allowedSet.has(entry.letter)) {
        ctx.addIssue({
          code: "custom",
          message: `Grupo inválido: ${entry.letter}`,
          path: ["groupAssignments"],
        });
        return;
      }
      const list = byLetter.get(entry.letter) ?? [];
      list.push(entry.teamId);
      byLetter.set(entry.letter, list);
    }

    if (byLetter.size !== expectedGroups) {
      ctx.addIssue({
        code: "custom",
        message: `Todos os ${expectedGroups} grupos devem estar preenchidos.`,
        path: ["groupAssignments"],
      });
      return;
    }

    for (const letter of allowedLetters) {
      const ids = byLetter.get(letter);
      if (!ids || ids.length !== 4) {
        ctx.addIssue({
          code: "custom",
          message: `O grupo ${letter} precisa de exatamente 4 seleções.`,
          path: ["groupAssignments"],
        });
        return;
      }
    }

    const uniqueIds = new Set(data.groupAssignments.map((e) => e.teamId));
    if (uniqueIds.size !== expectedTeams) {
      ctx.addIssue({
        code: "custom",
        message: "Cada seleção só pode aparecer uma vez na copa.",
        path: ["groupAssignments"],
      });
    }
  });

function parseGroupAssignments(
  formData: FormData,
): Array<{ letter: string; teamId: number }> {
  return formData.getAll("groupAssignments").map((raw) => {
    const [letter, teamIdStr] = String(raw).split(":");
    return { letter, teamId: Number(teamIdStr) };
  });
}

function parseOwnerAssignments(
  formData: FormData,
): Array<{ letter: string; teamId: number; ownerUserId: string }> {
  return formData.getAll("ownerAssignments").map((raw) => {
    const [letter, teamIdStr, ownerUserId] = String(raw).split(":");
    return { letter, teamId: Number(teamIdStr), ownerUserId };
  });
}

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
  const groupAssignments = parseGroupAssignments(formData);
  const ownerAssignments = parseOwnerAssignments(formData);
  const parsed = createChampSchema.safeParse({
    name: formData.get("name"),
    selectionMode: formData.get("selectionMode"),
    participantIds,
    formatSize: formData.get("formatSize"),
    groupAssignments,
  });

  if (!parsed.success) {
    return { error: "Dados da copa inválidos." };
  }

  const teamCount = await prisma.team.count();
  if (teamCount < 32) {
    return {
      error:
        "Sincronize pelo menos 32 seleções da API-Football antes de criar a copa.",
    };
  }

  if (parsed.data.formatSize === "48" && teamCount < 48) {
    return {
      error:
        "Para o formato de 48 seleções, sincronize pelo menos 48 times no catálogo.",
    };
  }

  const submittedIds = [
    ...new Set(parsed.data.groupAssignments.map((e) => e.teamId)),
  ];
  const existingTeams = await prisma.team.findMany({
    where: { id: { in: submittedIds } },
    select: { id: true },
  });
  if (existingTeams.length !== submittedIds.length) {
    return { error: "Uma ou mais seleções informadas não existem no catálogo." };
  }

  if (parsed.data.selectionMode === "MANUAL") {
    const expectedOwners = parsed.data.groupAssignments.length;
    if (ownerAssignments.length !== expectedOwners) {
      return {
        error: "Atribua um participante para cada seleção no modo manual.",
      };
    }

    const participantSet = new Set(parsed.data.participantIds);
    const ownerKeys = new Set<string>();
    const ownersByGroup = new Map<string, Set<string>>();

    for (const entry of ownerAssignments) {
      if (!participantSet.has(entry.ownerUserId)) {
        return { error: "Participante inválido na atribuição manual." };
      }

      const slotKey = `${entry.letter}:${entry.teamId}`;
      if (ownerKeys.has(slotKey)) {
        return { error: "Atribuição duplicada para a mesma seleção." };
      }
      ownerKeys.add(slotKey);

      const groupOwners = ownersByGroup.get(entry.letter) ?? new Set();
      if (groupOwners.has(entry.ownerUserId)) {
        return {
          error: `Cada participante só pode ter 1 seleção no grupo ${entry.letter}.`,
        };
      }
      groupOwners.add(entry.ownerUserId);
      ownersByGroup.set(entry.letter, groupOwners);
    }

    for (const ga of parsed.data.groupAssignments) {
      if (!ownerKeys.has(`${ga.letter}:${ga.teamId}`)) {
        return {
          error: "Atribua um participante para cada seleção no modo manual.",
        };
      }
    }
  }

  const byLetter = new Map<string, number[]>();
  for (const entry of parsed.data.groupAssignments) {
    const list = byLetter.get(entry.letter) ?? [];
    list.push(entry.teamId);
    byLetter.set(entry.letter, list);
  }

  const groupAssignmentsInput = [...byLetter.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, teamIds]) => ({
      letter,
      teamIds: teamIds as [number, number, number, number],
    }));

  try {
    const championship = await createChampionship({
      name: parsed.data.name,
      selectionMode: parsed.data.selectionMode,
      createdById: session.user.id,
      participantIds: parsed.data.participantIds,
      groupAssignments: groupAssignmentsInput,
    });

    if (parsed.data.selectionMode === "MANUAL" && ownerAssignments.length > 0) {
      await assignOwnersBulk(
        championship.id,
        ownerAssignments.map((a) => ({
          groupLetter: a.letter,
          teamId: a.teamId,
          ownerUserId: a.ownerUserId,
        })),
      );
    }

    revalidatePath("/admin/championships");
    revalidatePath(`/admin/championships/${championship.id}/teams`);
    revalidatePath(`/admin/championships/${championship.id}/matches`);
    return { success: true, id: championship.id };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Não foi possível criar a copa. Tente novamente.",
    };
  }
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

async function saveMatchResultInternal(
  formData: FormData,
  options: { requireUnplayed?: boolean; requirePlayed?: boolean },
) {
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

  if (options.requireUnplayed && match.played) {
    return { error: "Este jogo já tem resultado. Use Atualizar." };
  }

  if (options.requirePlayed && !match.played) {
    return { error: "Este jogo ainda não foi registrado. Use Registrar." };
  }

  try {
    assertMatchReadyForResult(match);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Confronto ainda não está pronto.";
    return { error: message };
  }

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

export async function registerMatchResultAction(formData: FormData) {
  await requireAdmin();
  return saveMatchResultInternal(formData, { requireUnplayed: true });
}

export async function updateMatchResultAction(formData: FormData) {
  await requireAdmin();
  return saveMatchResultInternal(formData, { requirePlayed: true });
}

export async function syncTeamsAction() {
  await requireAdmin();
  const { fetchWorldCupTeams } = await import("@/_lib/api-football");
  const result = await fetchWorldCupTeams(2026, 1);

  await upsertTeamsCatalog(result.teams);

  revalidatePath("/admin/championships");
  revalidatePath("/admin/championships/new");
  revalidatePath("/admin");
  return {
    success: true,
    count: result.teams.length,
    season: result.season,
    warning: result.warning,
  };
}
