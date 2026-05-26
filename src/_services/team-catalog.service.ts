import prisma from "@/_lib/prisma";
import type { ApiFootballTeam } from "@/_lib/api-football";

const BATCH_SIZE = 12;
const REMAP_TX_TIMEOUT_MS = 20_000;

/** IDs incorretos → seleções nacionais corretas (migração de syncs antigos). */
const TEAM_ID_CORRECTIONS: Record<number, number> = {
  483: 1532,
  837: 2383,
  2346: 11,
  /** Uzbequistão usava 1533 (ID real de Cabo Verde). */
  1533: 1568,
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
 * Grava o catálogo da Copa 2026 e migra referências de IDs antigos.
 * Uzbequistão (1568) é gravado antes do remap 1533→1568; Cabo Verde ocupa 1533 depois.
 */
export async function syncWorldCupTeamsCatalog(teams: ApiFootballTeam[]) {
  const uzbekistan = teams.find((t) => t.id === 1568);
  if (uzbekistan) {
    await upsertTeamsCatalog([uzbekistan]);
  }

  await remapIncorrectTeamIds();
  await upsertTeamsCatalog(teams);
}

/**
 * Corrige referências a IDs incorretos (uma transação curta por par de IDs).
 * Deve rodar após o destino (newId) existir no catálogo.
 */
export async function remapIncorrectTeamIds() {
  for (const [oldId, newId] of Object.entries(TEAM_ID_CORRECTIONS)) {
    await remapSingleTeamId(Number(oldId), newId);
  }
}

async function remapSingleTeamId(oldTeamId: number, newTeamId: number) {
  const newTeam = await prisma.team.findUnique({ where: { id: newTeamId } });
  if (!newTeam) return;

  await prisma.$transaction(
    async (tx) => {
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

      await Promise.all([
        tx.match.updateMany({
          where: { homeTeamId: oldTeamId },
          data: { homeTeamId: newTeamId },
        }),
        tx.match.updateMany({
          where: { awayTeamId: oldTeamId },
          data: { awayTeamId: newTeamId },
        }),
        tx.match.updateMany({
          where: { ownerContinuesTeamId: oldTeamId },
          data: { ownerContinuesTeamId: newTeamId },
        }),
      ]);

      const [refs, homeRefs, awayRefs, ownerRefs] = await Promise.all([
        tx.championshipTeam.count({ where: { teamId: oldTeamId } }),
        tx.match.count({ where: { homeTeamId: oldTeamId } }),
        tx.match.count({ where: { awayTeamId: oldTeamId } }),
        tx.match.count({ where: { ownerContinuesTeamId: oldTeamId } }),
      ]);

      if (refs + homeRefs + awayRefs + ownerRefs === 0) {
        await tx.team.deleteMany({ where: { id: oldTeamId } });
      }
    },
    { timeout: REMAP_TX_TIMEOUT_MS },
  );
}
