import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/_lib/session";
import { getChampionshipForView } from "@/_services/championship.service";
import { BracketTree } from "@/_components/championship/BracketTree";
import { PageEntrance } from "@/_components/anim/PageEntrance";
import prisma from "@/_lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function KnockoutPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const championship = await getChampionshipForView(id, session?.user.id);

  if (!championship) notFound();

  const koMatches = championship.matches.filter((m) => m.stage !== "GROUP");
  const hasR32 = koMatches.some((m) => m.stage === "R32");
  const teamIds = [...new Set(koMatches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))];
  const standInIds = [
    ...new Set(
      koMatches.flatMap((m) =>
        [m.homeStandInUserId, m.awayStandInUserId].filter(
          (id): id is string => id != null,
        ),
      ),
    ),
  ];

  const [teams, championshipTeams, standInUsers] = await Promise.all([
    prisma.team.findMany({ where: { id: { in: teamIds } } }),
    prisma.championshipTeam.findMany({
      where: { championshipId: id, teamId: { in: teamIds } },
      include: { owner: true },
    }),
    standInIds.length > 0
      ? prisma.user.findMany({ where: { id: { in: standInIds } } })
      : Promise.resolve([]),
  ]);

  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const ownerNameByTeamId = new Map(
    championshipTeams.map((ct) => [ct.teamId, ct.owner?.name ?? null]),
  );
  const standInNameById = Object.fromEntries(
    standInUsers.map((u) => [u.id, u.name]),
  );

  function participantForSide(
    teamId: number,
    standInUserId: string | null,
  ): { name: string | null; isStandIn: boolean } {
    if (standInUserId) {
      return {
        name: standInNameById[standInUserId] ?? "Stand-in",
        isStandIn: true,
      };
    }
    return {
      name: ownerNameByTeamId.get(teamId) ?? null,
      isStandIn: false,
    };
  }

  const bracketMatches = koMatches.map((m) => {
    const homeParticipant = participantForSide(m.homeTeamId, m.homeStandInUserId);
    const awayParticipant = participantForSide(m.awayTeamId, m.awayStandInUserId);

    return {
    id: m.id,
    stage: m.stage,
    homeName: teamById[m.homeTeamId]?.name ?? "?",
    awayName: teamById[m.awayTeamId]?.name ?? "?",
    homeLogo: teamById[m.homeTeamId]?.logoUrl ?? "",
    awayLogo: teamById[m.awayTeamId]?.logoUrl ?? "",
    homeParticipant: homeParticipant.name,
    homeParticipantIsStandIn: homeParticipant.isStandIn,
    awayParticipant: awayParticipant.name,
    awayParticipantIsStandIn: awayParticipant.isStandIn,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    played: m.played,
  };
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
        <h1 className="mt-2 text-2xl font-bold">Mata-mata</h1>
        <p className="text-sm text-muted">
          {hasR32
            ? "16-avos → Oitavas → Quartas → Semi → Final"
            : "Oitavas → Quartas → Semi → Final"}
        </p>
      </div>

      {bracketMatches.length === 0 ? (
        <p className="text-muted">
          O mata-mata será gerado quando todos os jogos da fase de grupos
          forem concluídos.
        </p>
      ) : (
        <BracketTree matches={bracketMatches} />
      )}
    </PageEntrance>
  );
}
