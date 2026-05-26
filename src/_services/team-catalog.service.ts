import prisma from "@/_lib/prisma";
import type { ApiFootballTeam } from "@/_lib/api-football";

const BATCH_SIZE = 12;

/** Persiste o catálogo global de seleções (sem transação longa — evita timeout P2028). */
export async function upsertTeamsCatalog(teams: ApiFootballTeam[]) {
  const syncedAt = new Date();

  for (let i = 0; i < teams.length; i += BATCH_SIZE) {
    const batch = teams.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((team) =>
        prisma.team.upsert({
          where: { id: team.id },
          create: { ...team, syncedAt },
          update: { ...team, syncedAt },
        }),
      ),
    );
  }
}
