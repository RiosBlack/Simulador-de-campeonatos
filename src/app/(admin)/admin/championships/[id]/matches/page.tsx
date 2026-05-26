import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/_lib/session";
import prisma from "@/_lib/prisma";
import { PageEntrance } from "@/_components/anim/PageEntrance";
import { MatchResultForm } from "@/_components/admin/MatchResultForm";
import { ensureGroupStageMatches } from "@/_services/team-assignment.service";
import { stageLabel } from "@/_utils/format";
import { countMatchCards } from "@/_utils/match-events";
import { Card } from "@/_components/ui/Card";
import { Badge } from "@/_components/ui/Badge";

type Props = { params: Promise<{ id: string }> };

type TeamInfo = { name: string; logoUrl: string };

type MatchRow = {
  id: string;
  stage: string;
  played: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeScorePen: number | null;
  awayScorePen: number | null;
  homeTeamId: number;
  awayTeamId: number;
  roundNumber: number | null;
  groupLetter: string | null;
  yellowHome: number;
  yellowAway: number;
  redHome: number;
  redAway: number;
};

export default async function AdminMatchesPage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  await ensureGroupStageMatches(id);

  const championship = await prisma.championship.findUnique({
    where: { id },
    include: {
      matches: {
        include: {
          events: true,
          group: { select: { letter: true } },
        },
        orderBy: [
          { stage: "asc" },
          { groupId: "asc" },
          { roundNumber: "asc" },
          { bracketSlot: "asc" },
        ],
      },
    },
  });

  if (!championship) notFound();

  const teamIds = [
    ...new Set(
      championship.matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]),
    ),
  ];
  const teams = await prisma.team.findMany({ where: { id: { in: teamIds } } });
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));

  const matchRows: MatchRow[] = championship.matches.map((m) => {
    const homeCards = countMatchCards(m.events, m.homeTeamId);
    const awayCards = countMatchCards(m.events, m.awayTeamId);
    return {
      id: m.id,
      stage: m.stage,
      played: m.played,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeScorePen: m.homeScorePen,
      awayScorePen: m.awayScorePen,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      roundNumber: m.roundNumber,
      groupLetter: m.group?.letter ?? null,
      yellowHome: homeCards.yellow,
      yellowAway: awayCards.yellow,
      redHome: homeCards.red,
      redAway: awayCards.red,
    };
  });

  const pending = matchRows.filter((m) => !m.played);
  const played = matchRows.filter((m) => m.played);

  return (
    <PageEntrance>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/admin/championships/${id}/teams`}
          className="text-sm text-muted hover:text-accent"
        >
          ← Times
        </Link>
        <Badge variant="muted">{matchRows.length} jogos</Badge>
      </div>
      <h1 className="mb-2 text-2xl font-bold">Lançar resultados</h1>
      <p className="mb-8 text-sm text-muted">
        {championship.name} — registre ou atualize cada jogo da copa.
      </p>

      <section className="mb-10">
        <h2 className="mb-1 text-xl font-semibold text-accent">Registrar</h2>
        <p className="mb-4 text-sm text-muted">
          Jogos sem resultado ({pending.length})
        </p>
        {pending.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              Todos os jogos já foram registrados.
            </p>
          </Card>
        ) : (
          <MatchesByPhase matches={pending} teamById={teamById} mode="register" />
        )}
      </section>

      <section>
        <h2 className="mb-1 text-xl font-semibold text-accent">Atualizar</h2>
        <p className="mb-4 text-sm text-muted">
          Jogos com resultado lançado ({played.length})
        </p>
        {played.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              Nenhum resultado para atualizar ainda.
            </p>
          </Card>
        ) : (
          <MatchesByPhase matches={played} teamById={teamById} mode="update" />
        )}
      </section>
    </PageEntrance>
  );
}

function MatchesByPhase({
  matches,
  teamById,
  mode,
}: {
  matches: MatchRow[];
  teamById: Record<number, TeamInfo>;
  mode: "register" | "update";
}) {
  const groupMatches = matches.filter((m) => m.stage === "GROUP");
  const koMatches = matches.filter((m) => m.stage !== "GROUP");

  const groupLetters = [
    ...new Set(groupMatches.map((m) => m.groupLetter).filter(Boolean)),
  ] as string[];

  return (
    <div className="space-y-8">
      {groupLetters.map((letter) => (
        <MatchSection
          key={`group-${letter}`}
          title={`Grupo ${letter}`}
          matches={groupMatches.filter((m) => m.groupLetter === letter)}
          teamById={teamById}
          mode={mode}
        />
      ))}
      {groupMatches.some((m) => !m.groupLetter) && (
        <MatchSection
          title="Fase de grupos"
          matches={groupMatches.filter((m) => !m.groupLetter)}
          teamById={teamById}
          mode={mode}
        />
      )}
      {koMatches.length > 0 && (
        <MatchSection
          title="Mata-mata"
          matches={koMatches}
          teamById={teamById}
          mode={mode}
        />
      )}
    </div>
  );
}

function MatchSection({
  title,
  matches,
  teamById,
  mode,
}: {
  title: string;
  matches: MatchRow[];
  teamById: Record<number, TeamInfo>;
  mode: "register" | "update";
}) {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="space-y-4">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            home={teamById[match.homeTeamId]}
            away={teamById[match.awayTeamId]}
            mode={mode}
          />
        ))}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  home,
  away,
  mode,
}: {
  match: MatchRow;
  home?: TeamInfo;
  away?: TeamInfo;
  mode: "register" | "update";
}) {
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-3 sm:justify-start">
          <TeamSide team={home} align="end" />
          <span className="shrink-0 text-xs font-semibold text-muted">vs</span>
          <TeamSide team={away} align="start" />
        </div>
        <div className="flex flex-wrap gap-2">
          {match.roundNumber != null && (
            <Badge variant="muted">R{match.roundNumber}</Badge>
          )}
          <Badge variant="muted">{stageLabel(match.stage)}</Badge>
          {mode === "update" &&
            match.homeScore != null &&
            match.awayScore != null && (
              <Badge variant="live">
                {match.homeScore} × {match.awayScore}
              </Badge>
            )}
        </div>
      </div>
      <MatchResultForm
        matchId={match.id}
        mode={mode}
        isKnockout={match.stage !== "GROUP"}
        defaultHome={match.homeScore ?? 0}
        defaultAway={match.awayScore ?? 0}
        defaultHomePen={match.homeScorePen ?? 0}
        defaultAwayPen={match.awayScorePen ?? 0}
        defaultYellowHome={match.yellowHome}
        defaultYellowAway={match.yellowAway}
        defaultRedHome={match.redHome}
        defaultRedAway={match.redAway}
      />
    </Card>
  );
}

function TeamSide({
  team,
  align,
}: {
  team?: TeamInfo;
  align: "start" | "end";
}) {
  const row =
    align === "end"
      ? "flex-row-reverse text-right"
      : "flex-row text-left";

  return (
    <div className={`flex min-w-0 max-w-[45%] items-center gap-2 ${row}`}>
      {team?.logoUrl ? (
        <Image
          src={team.logoUrl}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 object-contain"
          unoptimized
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-border text-xs text-muted">
          ?
        </span>
      )}
      <span className="truncate text-sm font-medium">{team?.name ?? "?"}</span>
    </div>
  );
}
