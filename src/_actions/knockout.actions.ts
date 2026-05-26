"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/_lib/prisma";
import { getSession } from "@/_lib/session";
import { resolveKnockoutOwnerConflict } from "@/_services/knockout.service";

const resolveConflictSchema = z.object({
  matchId: z.string().min(1),
  chosenTeamId: z.coerce.number().int().positive(),
});

export type ResolveKnockoutConflictState = {
  error?: string;
  success?: boolean;
  standInName?: string;
};

export async function resolveKnockoutConflictAction(
  _prev: ResolveKnockoutConflictState,
  formData: FormData,
): Promise<ResolveKnockoutConflictState> {
  const session = await getSession();
  if (!session?.user) {
    return { error: "Faça login para escolher sua seleção." };
  }

  const parsed = resolveConflictSchema.safeParse({
    matchId: formData.get("matchId"),
    chosenTeamId: formData.get("chosenTeamId"),
  });

  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  const match = await prisma.match.findUnique({
    where: { id: parsed.data.matchId },
  });

  if (!match) {
    return { error: "Confronto não encontrado." };
  }

  const participant = await prisma.championshipParticipant.findUnique({
    where: {
      championshipId_userId: {
        championshipId: match.championshipId,
        userId: session.user.id,
      },
    },
  });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  if (!participant && user?.role !== "ADMIN") {
    return { error: "Você não participa desta copa." };
  }

  try {
    const updated = await resolveKnockoutOwnerConflict(
      parsed.data.matchId,
      parsed.data.chosenTeamId,
      session.user.id,
    );

    const standInName =
      updated.homeStandIn?.name ?? updated.awayStandIn?.name ?? "Stand-in";

    revalidatePath(`/championships/${match.championshipId}/knockout`);
    revalidatePath(`/admin/championships/${match.championshipId}/matches`);

    return { success: true, standInName };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Não foi possível resolver o confronto.";
    return { error: message };
  }
}
