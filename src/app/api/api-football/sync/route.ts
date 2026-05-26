import { NextResponse } from "next/server";
import { fetchWorldCupTeams } from "@/_lib/api-football";
import { requireAdmin } from "@/_lib/session";
import { syncWorldCupTeamsCatalog } from "@/_services/team-catalog.service";

export async function POST() {
  try {
    await requireAdmin();
    const result = await fetchWorldCupTeams(2026, 1);

    await syncWorldCupTeamsCatalog(result.teams);

    return NextResponse.json({
      synced: result.teams.length,
      season: result.season,
      warning: result.warning,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao sincronizar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
