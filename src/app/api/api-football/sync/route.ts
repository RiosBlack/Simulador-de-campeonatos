import { NextResponse } from "next/server";
import { fetchWorldCupTeams } from "@/_lib/api-football";
import { requireAdmin } from "@/_lib/session";
import prisma from "@/_lib/prisma";

export async function POST() {
  try {
    await requireAdmin();
    const teams = await fetchWorldCupTeams(2026, 1);

    await prisma.$transaction(
      teams.map((team) =>
        prisma.team.upsert({
          where: { id: team.id },
          create: {
            id: team.id,
            name: team.name,
            code: team.code,
            country: team.country,
            logoUrl: team.logoUrl,
          },
          update: {
            name: team.name,
            code: team.code,
            country: team.country,
            logoUrl: team.logoUrl,
            syncedAt: new Date(),
          },
        }),
      ),
    );

    return NextResponse.json({ synced: teams.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao sincronizar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
