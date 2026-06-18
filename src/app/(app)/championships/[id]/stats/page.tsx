import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/_lib/session";
import prisma from "@/_lib/prisma";
import { getChampionshipForView } from "@/_services/championship.service";
import { calculateChampionshipStats } from "@/_services/stats.service";
import { GoalsChart } from "@/_components/charts/GoalsChart";
import { StatsRankingTable } from "@/_components/championship/StatsRankingTable";
import { Card } from "@/_components/ui/Card";
import { PageEntrance } from "@/_components/anim/PageEntrance";

type Props = { params: Promise<{ id: string }> };

const TEAM_CHART_LIMIT = 6;

function StatsSection({
  title,
  description,
  chart,
  leftTable,
  rightTable,
}: {
  title: string;
  description?: string;
  chart: React.ReactNode;
  leftTable: React.ReactNode;
  rightTable: React.ReactNode;
}) {
  return (
    <Card className="min-w-0">
      <h2 className="font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted">{description}</p>
      )}
      <div className="mt-4">{chart}</div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {leftTable}
        {rightTable}
      </div>
    </Card>
  );
}

function TableBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-3 text-sm font-medium text-accent">{title}</h3>
      {children}
    </div>
  );
}

export default async function StatsPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const championship = await getChampionshipForView(id, session?.user.id);

  if (!championship) notFound();

  const teams = championship.groups.flatMap((g) => g.teams);
  const participants = championship.participants.map((p) => ({
    userId: p.userId,
    name: p.user.name,
  }));

  const standInIds = [
    ...new Set(
      championship.matches.flatMap((m) =>
        [m.homeStandInUserId, m.awayStandInUserId].filter(
          (uid): uid is string => uid != null,
        ),
      ),
    ),
  ];
  const standInUsers =
    standInIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: standInIds } } })
      : [];
  const standInNameById = new Map(
    standInUsers.map((u) => [u.id, u.name] as const),
  );

  const stats = calculateChampionshipStats({
    teams,
    participants,
    matches: championship.matches,
    standInNameById,
  });

  const hasPlayedMatches = championship.matches.some(
    (m) => m.played && m.homeScore != null,
  );

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

      {!hasPlayedMatches ? (
        <Card>
          <p className="text-sm text-muted">Nenhum jogo registrado ainda.</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          <StatsSection
            title="Gols por seleção"
            description="Gols marcados e sofridos por cada seleção da copa."
            chart={
              <GoalsChart
                data={stats.teamGoalsScored.slice(0, TEAM_CHART_LIMIT)}
              />
            }
            leftTable={
              <TableBlock title="Gols feitos">
                <StatsRankingTable
                  rows={stats.teamGoalsScoredTable}
                  valueLabel="Gols"
                  showLogo
                />
              </TableBlock>
            }
            rightTable={
              <TableBlock title="Gols sofridos">
                <StatsRankingTable
                  rows={stats.teamGoalsConcededTable}
                  valueLabel="Gols"
                  showLogo
                />
              </TableBlock>
            }
          />

          <StatsSection
            title="Gols por jogador"
            description="Gols marcados e sofridos pelos participantes (inclui stand-ins)."
            chart={
              <GoalsChart
                data={stats.playerGoalsScored}
                height={Math.max(280, participants.length * 32)}
              />
            }
            leftTable={
              <TableBlock title="Gols feitos">
                <StatsRankingTable
                  rows={stats.playerGoalsScored.map((row, index) => ({
                    rank: index + 1,
                    name: row.name,
                    value: row.goals,
                  }))}
                  valueLabel="Gols"
                />
              </TableBlock>
            }
            rightTable={
              <TableBlock title="Gols sofridos">
                <StatsRankingTable
                  rows={stats.playerGoalsConceded.map((row, index) => ({
                    rank: index + 1,
                    name: row.name,
                    value: row.goals,
                  }))}
                  valueLabel="Gols"
                />
              </TableBlock>
            }
          />

          <Card className="min-w-0">
            <h2 className="font-semibold">Cartões</h2>
            <p className="mt-1 text-sm text-muted">
              Ranking de cartões amarelos e vermelhos por seleção e por jogador.
            </p>

            <div className="mt-6 space-y-8">
              <div>
                <h3 className="mb-4 text-sm font-medium text-accent">
                  Cartões amarelos
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <TableBlock title="Por seleção">
                    <StatsRankingTable
                      rows={stats.teamYellowCards}
                      valueLabel="Amarelos"
                      showLogo
                    />
                  </TableBlock>
                  <TableBlock title="Por jogador">
                    <StatsRankingTable
                      rows={stats.playerYellowCards}
                      valueLabel="Amarelos"
                    />
                  </TableBlock>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-medium text-accent">
                  Cartões vermelhos
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <TableBlock title="Por seleção">
                    <StatsRankingTable
                      rows={stats.teamRedCards}
                      valueLabel="Vermelhos"
                      showLogo
                    />
                  </TableBlock>
                  <TableBlock title="Por jogador">
                    <StatsRankingTable
                      rows={stats.playerRedCards}
                      valueLabel="Vermelhos"
                    />
                  </TableBlock>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageEntrance>
  );
}
