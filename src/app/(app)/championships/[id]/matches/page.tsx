import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/_lib/session";
import prisma from "@/_lib/prisma";
import { getChampionshipForView } from "@/_services/championship.service";
import { isOwnerConflictPending } from "@/_services/knockout.service";
import {
  MatchList,
  type MatchListItem,
} from "@/_components/championship/MatchList";
import { Card } from "@/_components/ui/Card";
import { PageEntrance } from "@/_components/anim/PageEntrance";

type Props = { params: Promise<{ id: string }> };

function sortMatches(a: MatchListItem, b: MatchListItem): number {
  if (a.stage !== b.stage) return a.stage.localeCompare(b.stage);
  const groupA = a.groupLetter ?? "";
  const groupB = b.groupLetter ?? "";
  if (groupA !== groupB) return groupA.localeCompare(groupB);
  const roundA = a.roundNumber ?? 0;
  const roundB = b.roundNumber ?? 0;
  if (roundA !== roundB) return roundA - roundB;
  return 0;
}

export default async function MatchesPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const championship = await getChampionshipForView(id, session?.user.id);

  if (!championship) notFound();

  const groupLetterByMatchId = new Map(
    championship.groups.flatMap((g) =>
      g.matches.map((m) => [m.id, g.letter] as const),
    ),
  );

  const ownerNameByTeamId = new Map(
    championship.groups.flatMap((g) =>
      g.teams.map((ct) => [ct.teamId, ct.owner?.name ?? null] as const),
    ),
  );

  const teamById = Object.fromEntries(
    championship.groups.flatMap((g) =>
      g.teams.map((ct) => [
        ct.teamId,
        { name: ct.team.name, logoUrl: ct.team.logoUrl },
      ]),
    ),
  );

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
  const standInNameById = Object.fromEntries(
    standInUsers.map((u) => [u.id, u.name]),
  );

  function participantName(
    m: {
      homeTeamId: number;
      awayTeamId: number;
      homeStandInUserId: string | null;
      awayStandInUserId: string | null;
      ownerConflictUserId: string | null;
      ownerContinuesTeamId: number | null;
    },
    side: "home" | "away",
  ): string | null {
    if (isOwnerConflictPending(m)) return null;
    const teamId = side === "home" ? m.homeTeamId : m.awayTeamId;
    const standInId =
      side === "home" ? m.homeStandInUserId : m.awayStandInUserId;
    if (standInId) return standInNameById[standInId] ?? null;
    return ownerNameByTeamId.get(teamId) ?? null;
  }

  const matchItems: MatchListItem[] = championship.matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    played: m.played,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeScorePen: m.homeScorePen,
    awayScorePen: m.awayScorePen,
    roundNumber: m.roundNumber,
    groupLetter: groupLetterByMatchId.get(m.id) ?? null,
    scheduledAt: m.scheduledAt,
    homePlayerName: participantName(m, "home"),
    awayPlayerName: participantName(m, "away"),
  }));

  const upcoming = matchItems.filter((m) => !m.played).sort(sortMatches);
  const results = matchItems.filter((m) => m.played).sort(sortMatches);

  return (
    <PageEntrance>
      <div className="mb-6">
        <Link
          href={`/championships/${id}`}
          className="text-sm text-muted hover:text-accent"
        >
          ← Copa
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Jogos</h1>
        <p className="text-sm text-muted">
          {results.length} disputados · {upcoming.length} a acontecer
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-1 text-xl font-semibold text-accent">
          Próximos jogos
        </h2>
        <p className="mb-4 text-sm text-muted">
          Jogos sem resultado ({upcoming.length})
        </p>
        {upcoming.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              Todos os jogos já foram disputados.
            </p>
          </Card>
        ) : (
          <MatchList matches={upcoming} teamById={teamById} />
        )}
      </section>

      <section>
        <h2 className="mb-1 text-xl font-semibold text-accent">Resultados</h2>
        <p className="mb-4 text-sm text-muted">
          Jogos com resultado ({results.length})
        </p>
        {results.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              Nenhum resultado registrado ainda.
            </p>
          </Card>
        ) : (
          <MatchList matches={results} teamById={teamById} />
        )}
      </section>
    </PageEntrance>
  );
}
