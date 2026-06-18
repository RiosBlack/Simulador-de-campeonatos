import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { WORLD_CUP_2026_TEAMS } from "../src/_data/world-cup-2026-teams";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  localTeamLogoUrl,
  remoteTeamLogoUrl,
} from "../src/_utils/team-logo";

const LOGOS_DIR = path.join(process.cwd(), "public", "teams");

async function downloadLogo(teamId: number): Promise<"saved" | "skipped" | "failed"> {
  const dest = path.join(LOGOS_DIR, `${teamId}.png`);
  const url = remoteTeamLogoUrl(teamId);

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      console.error(`  ✗ id=${teamId} HTTP ${response.status}`);
      return "failed";
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 8 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
      console.error(`  ✗ id=${teamId} resposta não é PNG válido`);
      return "failed";
    }

    await writeFile(dest, buffer);
    return "saved";
  } catch (error) {
    console.error(`  ✗ id=${teamId}`, error instanceof Error ? error.message : error);
    return "failed";
  }
}

async function migrateDatabaseLogoUrls() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("DATABASE_URL ausente — pulando atualização do banco.");
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const teams = await prisma.team.findMany({ select: { id: true } });
    let updated = 0;

    for (const team of teams) {
      const logoUrl = localTeamLogoUrl(team.id);
      const result = await prisma.team.updateMany({
        where: { id: team.id, logoUrl: { not: logoUrl } },
        data: { logoUrl },
      });
      updated += result.count;
    }

    console.log(`Banco: ${updated} seleção(ões) com logoUrl atualizada(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await mkdir(LOGOS_DIR, { recursive: true });

  console.log(`Baixando ${WORLD_CUP_2026_TEAMS.length} logos para public/teams/…`);

  let saved = 0;
  let failed = 0;

  for (const team of WORLD_CUP_2026_TEAMS) {
    const result = await downloadLogo(team.id);
    if (result === "saved") saved += 1;
    if (result === "failed") failed += 1;
  }

  console.log(`Arquivos: ${saved} salvos, ${failed} falhas.`);

  if (failed > 0) {
    process.exitCode = 1;
  }

  await migrateDatabaseLogoUrls();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
