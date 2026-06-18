import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/_lib/session";
import { getChampionshipForView } from "@/_services/championship.service";
import {
  calculateGroupStandings,
  getCurrentQualifiedTeamIds,
  getThirdPlaceStandings,
  type GroupStandingsInput,
} from "@/_services/standings.service";
import { GroupTable } from "@/_components/championship/GroupTable";
import { ThirdPlaceTable } from "@/_components/championship/ThirdPlaceTable";
import { Card } from "@/_components/ui/Card";
import { PageEntrance } from "@/_components/anim/PageEntrance";

type Props = { params: Promise<{ id: string }> };

export default async function GroupsPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const championship = await getChampionshipForView(id, session?.user.id);

  if (!championship) notFound();
  const groupCount = championship.groups.length;
  const qualifierText =
    groupCount === 12
      ? "12 grupos · 2 primeiros + 8 melhores 3ºs avançam"
      : "8 grupos · 2 primeiros avançam";

  const tieBreakSeed = championship.tieBreakSeed ?? Math.random();
  const groupInputs: GroupStandingsInput[] = championship.groups.map(
    (group) => ({
      letter: group.letter,
      teams: group.teams.map((t) => ({
        teamId: t.teamId,
        teamName: t.team.name,
        logoUrl: t.team.logoUrl,
        ownerUserId: t.ownerUserId,
        ownerName: t.owner?.name ?? null,
      })),
      matches: group.matches,
    }),
  );
  const qualifiedTeamIds = getCurrentQualifiedTeamIds(
    groupInputs,
    tieBreakSeed,
  );
  const { ranked: thirdPlaces, qualifyingCount: thirdPlaceQualifyingCount } =
    getThirdPlaceStandings(groupInputs, tieBreakSeed);

  return (
    <PageEntrance className="min-w-0 max-w-full">
      <div className="mb-6">
        <Link
          href={`/championships/${id}`}
          className="text-sm text-muted hover:text-accent"
        >
          ← Copa
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Fase de Grupos</h1>
        <p className="text-sm text-muted">{qualifierText}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded-sm bg-accent/30 ring-1 ring-accent/40" />
            1º e 2º colocados
          </span>
          {thirdPlaceQualifyingCount > 0 && (
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-6 rounded-sm bg-emerald-500/30 ring-1 ring-emerald-500/40" />
              Melhores 3º colocados
            </span>
          )}
        </p>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {championship.groups.map((group, index) => {
          const input = groupInputs[index]!;
          const standings = calculateGroupStandings(
            input.teams,
            input.matches,
            tieBreakSeed,
          );

          return (
            <Card key={group.id} className="min-w-0 overflow-hidden p-3 sm:p-4 md:p-6">
              <GroupTable
                letter={group.letter}
                rows={standings}
                qualifiedTeamIds={qualifiedTeamIds}
              />
            </Card>
          );
        })}
      </div>

      {thirdPlaces.length > 0 && (
        <Card className="mt-4 min-w-0 overflow-hidden p-3 sm:mt-6 sm:p-4 md:p-6">
          <ThirdPlaceTable
            rows={thirdPlaces}
            qualifyingCount={thirdPlaceQualifyingCount}
          />
        </Card>
      )}
    </PageEntrance>
  );
}
