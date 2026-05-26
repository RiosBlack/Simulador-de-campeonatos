import { requireAdmin } from "@/_lib/session";
import prisma from "@/_lib/prisma";
import { Card } from "@/_components/ui/Card";
import { PageEntrance } from "@/_components/anim/PageEntrance";
import { CreateChampionshipForm } from "@/_components/admin/CreateChampionshipForm";

export default async function NewChampionshipPage() {
  await requireAdmin();
  const allUsers = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, logoUrl: true, country: true },
  });
  const teamCount = teams.length;

  return (
    <PageEntrance>
      <h1 className="mb-6 text-2xl font-bold">Nova Copa</h1>
      {teamCount < 32 && (
        <Card className="mb-6 border-amber-500/30 bg-amber-900/20">
          <p className="text-sm text-amber-200">
            Sincronize ao menos 32 seleções antes de criar ({teamCount}/32).
          </p>
        </Card>
      )}
      {teamCount >= 32 && teamCount < 48 && (
        <Card className="mb-6 border-amber-500/30 bg-amber-900/20">
          <p className="text-sm text-amber-200">
            Catálogo com {teamCount} seleções. Você poderá montar grupos no
            formato de 32 equipes (8 grupos). Para 48 equipes (12 grupos),
            sincronize mais seleções da API-Football.
          </p>
        </Card>
      )}
      <Card>
        <CreateChampionshipForm users={allUsers} teams={teams} />
      </Card>
    </PageEntrance>
  );
}
