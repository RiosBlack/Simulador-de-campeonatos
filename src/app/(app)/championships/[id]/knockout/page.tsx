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
      bracketSlot: m.bracketSlot,
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
      isPlaceholder: false,
    };
  });

  // Completa visualmente a chave até a final com jogos futuros (placeholders).
  const stagesOrder = hasR32
    ? (["R32", "R16", "QF", "SF", "FINAL"] as const)
    : (["R16", "QF", "SF", "FINAL"] as const);

  const slotsPerStage: Record<string, number> = hasR32
    ? { R32: 16, R16: 8, QF: 4, SF: 2, FINAL: 1 }
    : { R16: 8, QF: 4, SF: 2, FINAL: 1 };

  const matchByStageSlot = new Map<string, (typeof bracketMatches)[number]>();
  for (const m of bracketMatches) {
    if (m.bracketSlot == null) continue;
    matchByStageSlot.set(`${m.stage}-${m.bracketSlot}`, m);
  }

  // Para cada slot, guarda o label do confronto (apenas "TimeA / TimeB", sem prefixo "Venc.").
  // Jogos reais usam os nomes dos times; placeholders geram a partir dos feeders da fase anterior.
  // Assim "Venc." só é prefixado uma vez, sem cascata.
  const matchLabelBySlot = new Map<string, string>();
  for (const m of bracketMatches) {
    if (m.bracketSlot == null || m.isPlaceholder) continue;
    matchLabelBySlot.set(`${m.stage}-${m.bracketSlot}`, `${m.homeName} / ${m.awayName}`);
  }

  for (let i = 0; i < stagesOrder.length; i++) {
    const stage = stagesOrder[i]!;
    const count = slotsPerStage[stage];

    for (let slot = 0; slot < count; slot++) {
      const key = `${stage}-${slot}`;
      if (matchByStageSlot.has(key)) continue;

      let homeName = "A definir";
      let awayName = "A definir";

      const prevStage = stagesOrder[i - 1];
      if (prevStage) {
        const slotA = slot * 2;
        const slotB = slot * 2 + 1;
        const labelA = matchLabelBySlot.get(`${prevStage}-${slotA}`);
        const labelB = matchLabelBySlot.get(`${prevStage}-${slotB}`);
        if (labelA) homeName = `Venc. ${labelA}`;
        if (labelB) awayName = `Venc. ${labelB}`;
      }

      // Registra o label deste placeholder (sem "Venc." para não cascatear)
      matchLabelBySlot.set(`${stage}-${slot}`, `${homeName} / ${awayName}`);

      const placeholder = {
        id: `placeholder-${stage}-${slot}`,
        bracketSlot: slot,
        stage,
        homeName,
        awayName,
        homeLogo: "",
        awayLogo: "",
        homeParticipant: null,
        homeParticipantIsStandIn: false,
        awayParticipant: null,
        awayParticipantIsStandIn: false,
        conflictPending: false,
        homeScore: null,
        awayScore: null,
        played: false,
        isPlaceholder: true,
      } as (typeof bracketMatches)[number];

      bracketMatches.push(placeholder);
      matchByStageSlot.set(key, placeholder);
    }
  }

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
