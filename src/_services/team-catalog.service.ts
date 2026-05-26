import prisma from "@/_lib/prisma";
import type { ApiFootballTeam } from "@/_lib/api-football";

const BATCH_SIZE = 12;

/** IDs incorretos no supplement antigo → seleções nacionais corretas. */
const TEAM_ID_CORRECTIONS: Record<number, number> = {
  483: 1532,
  837: 2383,
  2346: 11,
};

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

/**
 * Corrige referências a IDs de clubes usados por engano como seleções.
 * Deve rodar após upsertTeamsCatalog (FK exige que o newId já exista).
 */
export async function remapIncorrectTeamIds() {
  await prisma.$transaction(async (tx) => {
    for (const [oldId, newId] of Object.entries(TEAM_ID_CORRECTIONS)) {
      const oldTeamId = Number(oldId);
      const newTeamId = newId;

      const newTeam = await tx.team.findUnique({ where: { id: newTeamId } });
      if (!newTeam) continue;

      const championshipTeams = await tx.championshipTeam.findMany({
        where: { teamId: oldTeamId },
      });

      for (const ct of championshipTeams) {
        const duplicate = await tx.championshipTeam.findUnique({
          where: {
            championshipId_teamId: {
              championshipId: ct.championshipId,
              teamId: newTeamId,
            },
          },
        });

        if (duplicate) {
          await tx.championshipTeam.delete({ where: { id: ct.id } });
        } else {
          await tx.championshipTeam.update({
            where: { id: ct.id },
            data: { teamId: newTeamId },
          });
        }
      }

      await tx.match.updateMany({
        where: { homeTeamId: oldTeamId },
        data: { homeTeamId: newTeamId },
      });
      await tx.match.updateMany({
        where: { awayTeamId: oldTeamId },
        data: { awayTeamId: newTeamId },
      });
      await tx.match.updateMany({
        where: { ownerContinuesTeamId: oldTeamId },
        data: { ownerContinuesTeamId: newTeamId },
      });

      const refs = await tx.championshipTeam.count({
        where: { teamId: oldTeamId },
      });
      const homeRefs = await tx.match.count({ where: { homeTeamId: oldTeamId } });
      const awayRefs = await tx.match.count({ where: { awayTeamId: oldTeamId } });
      const ownerRefs = await tx.match.count({
        where: { ownerContinuesTeamId: oldTeamId },
      });

      if (refs + homeRefs + awayRefs + ownerRefs === 0) {
        await tx.team.deleteMany({ where: { id: oldTeamId } });
      }
    }
  });
}
