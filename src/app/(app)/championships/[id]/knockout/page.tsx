import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/_lib/session";
import { getChampionshipForView } from "@/_services/championship.service";
import { isOwnerConflictPending } from "@/_services/knockout.service";
import { BracketTree } from "@/_components/championship/BracketTree";
import {
  KnockoutConflictResolver,
  type OwnerKnockoutConflict,
} from "@/_components/championship/KnockoutConflictResolver";
import {
  KnockoutConflictWaiting,
  type WaitingKnockoutConflict,
} from "@/_components/championship/KnockoutConflictWaiting";
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
          (uid): uid is string => uid != null,
        ),
      ),
    ),
  ];
  const conflictOwnerIds = [
    ...new Set(
      koMatches
        .map((m) => m.ownerConflictUserId)
        .filter((uid): uid is string => uid != null),
    ),
  ];

  const [teams, championshipTeams, standInUsers, conflictOwners] =
    await Promise.all([
      prisma.team.findMany({ where: { id: { in: teamIds } } }),
      prisma.championshipTeam.findMany({
        where: { championshipId: id, teamId: { in: teamIds } },
        include: { owner: true },
      }),
      standInIds.length > 0
        ? prisma.user.findMany({ where: { id: { in: standInIds } } })
        : Promise.resolve([]),
      conflictOwnerIds.length > 0
        ? prisma.user.findMany({ where: { id: { in: conflictOwnerIds } } })
        : Promise.resolve([]),
    ]);

  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const ownerNameByTeamId = new Map(
    championshipTeams.map((ct) => [ct.teamId, ct.owner?.name ?? null]),
  );
  const standInNameById = Object.fromEntries(
    standInUsers.map((u) => [u.id, u.name]),
  );
  const conflictOwnerNameById = Object.fromEntries(
    conflictOwners.map((u) => [u.id, u.name]),
  );

  function participantForSide(
    teamId: number,
    standInUserId: string | null,
    pending: boolean,
  ): { name: string | null; isStandIn: boolean } {
    if (pending) {
      return { name: null, isStandIn: false };
    }
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

  const ownerConflicts: OwnerKnockoutConflict[] = [];
  const waitingConflicts: WaitingKnockoutConflict[] = [];

  const bracketMatches = koMatches.map((m) => {
    const pending = isOwnerConflictPending(m);
    const home = teamById[m.homeTeamId];
    const away = teamById[m.awayTeamId];

    if (pending && m.ownerConflictUserId) {
      const ownerName =
        conflictOwnerNameById[m.ownerConflictUserId] ?? "Participante";
      if (session?.user.id === m.ownerConflictUserId) {
        ownerConflicts.push({
          matchId: m.id,
          stage: m.stage,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          homeName: home?.name ?? "?",
          awayName: away?.name ?? "?",
          homeLogo: home?.logoUrl ?? "",
          awayLogo: away?.logoUrl ?? "",
        });
      } else {
        waitingConflicts.push({
          matchId: m.id,
          stage: m.stage,
          homeName: home?.name ?? "?",
          awayName: away?.name ?? "?",
          ownerName,
        });
      }
    }

    const homeParticipant = participantForSide(
      m.homeTeamId,
      m.homeStandInUserId,
      pending,
    );
    const awayParticipant = participantForSide(
      m.awayTeamId,
      m.awayStandInUserId,
      pending,
    );

    return {
      id: m.id,
      stage: m.stage,
      homeName: home?.name ?? "?",
      awayName: away?.name ?? "?",
      homeLogo: home?.logoUrl ?? "",
      awayLogo: away?.logoUrl ?? "",
      homeParticipant: homeParticipant.name,
      homeParticipantIsStandIn: homeParticipant.isStandIn,
      awayParticipant: awayParticipant.name,
      awayParticipantIsStandIn: awayParticipant.isStandIn,
      conflictPending: pending,
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

      <KnockoutConflictResolver conflicts={ownerConflicts} />
      <KnockoutConflictWaiting conflicts={waitingConflicts} />

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
