import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/_lib/session";
import { getChampionshipForView } from "@/_services/championship.service";
import { GoalsChart } from "@/_components/charts/GoalsChart";
import { GroupComparison } from "@/_components/charts/GroupComparison";
import { Card } from "@/_components/ui/Card";
import { PageEntrance } from "@/_components/anim/PageEntrance";
import prisma from "@/_lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function StatsPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const championship = await getChampionshipForView(id, session?.user.id);

  if (!championship) notFound();

  const playedMatches = championship.matches.filter(
    (m) => m.played && m.homeScore != null,
  );

  const teamIds = [...new Set(playedMatches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))];
  const teams = await prisma.team.findMany({ where: { id: { in: teamIds } } });
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));

  const goalsByTeam = new Map<number, number>();
  for (const m of playedMatches) {
    goalsByTeam.set(
      m.homeTeamId,
      (goalsByTeam.get(m.homeTeamId) ?? 0) + (m.homeScore ?? 0),
    );
    goalsByTeam.set(
      m.awayTeamId,
      (goalsByTeam.get(m.awayTeamId) ?? 0) + (m.awayScore ?? 0),
    );
  }

  const goalsData = [...goalsByTeam.entries()]
    .map(([teamId, goals]) => ({
      name: teamById[teamId]?.code ?? teamById[teamId]?.name ?? "?",
      goals,
    }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 12);

  const rounds = [1, 2, 3];
  const groupLetters = championship.groups.map((g) => g.letter).slice(0, 6);
  const evolutionData = rounds.map((round) => {
    const row: Record<string, string | number> = { round: `R${round}` };
    for (const letter of groupLetters) {
      const group = championship.groups.find((g) => g.letter === letter);
      const roundMatches =
        group?.matches.filter(
          (m) => m.played && m.roundNumber && m.roundNumber <= round,
        ) ?? [];
      const pts = roundMatches.reduce((sum, m) => {
        const home = m.homeScore ?? 0;
        const away = m.awayScore ?? 0;
        return sum + home + away;
      }, 0);
      row[letter] = pts;
    }
    return row;
  });

  return (
    <PageEntrance>
      <div className="mb-6">
        <Link
          href={`/championships/${id}`}
          className="text-sm text-muted hover:text-accent"
        >
          ← Copa
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Estatísticas</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Gols por seleção</h2>
          {goalsData.length > 0 ? (
            <GoalsChart data={goalsData} />
          ) : (
            <p className="text-sm text-muted">Nenhum jogo registrado ainda.</p>
          )}
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Evolução por grupo</h2>
          <GroupComparison data={evolutionData} groups={groupLetters} />
        </Card>
      </div>
    </PageEntrance>
  );
}
