import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/_lib/session";
import prisma from "@/_lib/prisma";
import { PageEntrance } from "@/_components/anim/PageEntrance";
import { MatchResultForm } from "@/_components/admin/MatchResultForm";
import { stageLabel } from "@/_utils/format";
import { Card } from "@/_components/ui/Card";
import { Badge } from "@/_components/ui/Badge";

type Props = { params: Promise<{ id: string }> };

export default async function AdminMatchesPage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  const championship = await prisma.championship.findUnique({
    where: { id },
    include: {
      matches: {
        orderBy: [{ stage: "asc" }, { roundNumber: "asc" }, { bracketSlot: "asc" }],
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

  const groupMatches = championship.matches.filter((m) => m.stage === "GROUP");
  const koMatches = championship.matches.filter((m) => m.stage !== "GROUP");

  return (
    <PageEntrance>
      <Link
        href={`/admin/championships/${id}/teams`}
        className="text-sm text-muted hover:text-accent"
      >
        ← Times
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Lançar resultados</h1>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Fase de grupos</h2>
        <div className="space-y-4">
          {groupMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              home={teamById[match.homeTeamId]}
              away={teamById[match.awayTeamId]}
            />
          ))}
        </div>
      </section>

      {koMatches.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Mata-mata</h2>
          <div className="space-y-4">
            {koMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                home={teamById[match.homeTeamId]}
                away={teamById[match.awayTeamId]}
              />
            ))}
          </div>
        </section>
      )}
    </PageEntrance>
  );
}

function MatchCard({
  match,
  home,
  away,
}: {
  match: {
    id: string;
    stage: string;
    played: boolean;
    homeScore: number | null;
    awayScore: number | null;
    roundNumber: number | null;
  };
  home?: { name: string };
  away?: { name: string };
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">
          {home?.name ?? "?"} vs {away?.name ?? "?"}
        </span>
        <div className="flex gap-2">
          {match.roundNumber && (
            <Badge variant="muted">R{match.roundNumber}</Badge>
          )}
          <Badge variant="muted">{stageLabel(match.stage)}</Badge>
          {match.played && <Badge variant="live">OK</Badge>}
        </div>
      </div>
      <MatchResultForm
        matchId={match.id}
        isKnockout={match.stage !== "GROUP"}
        defaultHome={match.homeScore ?? 0}
        defaultAway={match.awayScore ?? 0}
        played={match.played}
      />
    </Card>
  );
}
