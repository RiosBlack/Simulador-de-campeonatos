import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/_lib/session";
import prisma from "@/_lib/prisma";
import { Button } from "@/_components/ui/Button";
import { PageEntrance } from "@/_components/anim/PageEntrance";
import { TeamsAssignmentPanel } from "@/_components/admin/TeamsAssignmentPanel";
import { AddTeamPanel } from "@/_components/admin/AddTeamPanel";
import { startGroupsAction } from "@/_actions/admin.actions";
import { StartGroupsButton } from "@/_components/admin/StartGroupsButton";

type Props = { params: Promise<{ id: string }> };

export default async function AdminTeamsPage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  const championship = await prisma.championship.findUnique({
    where: { id },
    include: {
      participants: { include: { user: true } },
      groups: {
        orderBy: { letter: "asc" },
        include: {
          teams: { include: { team: true, owner: true } },
        },
      },
    },
  });

  if (!championship) notFound();

  const groupIds = championship.groups.map((g) => g.id);
  const usedTeamIds = championship.groups.flatMap((g) =>
    g.teams.map((t) => t.teamId),
  );

  const [playedMatchesByGroup, allTeams, allUsers] = await Promise.all([
    prisma.match.groupBy({
      by: ["groupId"],
      where: {
        championshipId: id,
        groupId: { in: groupIds },
        played: true,
      },
      _count: { id: true },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, logoUrl: true },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const playedGroupIds = new Set(
    playedMatchesByGroup
      .filter((row) => row._count.id > 0 && row.groupId)
      .map((row) => row.groupId!),
  );

  const totalTeams = usedTeamIds.length;
  const maxTeams = championship.groups.length * 4;

  const groupsWithMeta = championship.groups.map((g) => ({
    ...g,
    teamCount: g.teams.length,
    hasPlayedMatches: playedGroupIds.has(g.id),
  }));

  const eligibleGroups = groupsWithMeta
    .filter((g) => g.teamCount < 4 && !g.hasPlayedMatches)
    .map((g) => ({
      id: g.id,
      letter: g.letter,
      teamCount: g.teamCount,
      ownersInGroup: g.teams
        .map((t) => t.ownerUserId)
        .filter((uid): uid is string => Boolean(uid)),
    }));

  const usedTeamIdSet = new Set(usedTeamIds);
  const availableTeams = allTeams.filter((t) => !usedTeamIdSet.has(t.id));

  const unassigned = championship.groups
    .flatMap((g) => g.teams)
    .filter((t) => !t.ownerUserId).length;

  return (
    <PageEntrance>
      <Link
        href="/admin/championships"
        className="text-sm text-muted hover:text-accent"
      >
        ← Copas
      </Link>
      <h1 className="mt-2 mb-2 text-2xl font-bold">{championship.name}</h1>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Modo: {championship.selectionMode} · {totalTeams}/{maxTeams}{" "}
          seleções · {unassigned} sem dono
        </p>
        <Link href={`/admin/championships/${id}/matches`}>
          <Button variant="secondary" size="sm">
            Lançar jogos
          </Button>
        </Link>
      </div>

      <AddTeamPanel
        championshipId={id}
        status={championship.status}
        totalTeams={totalTeams}
        maxTeams={maxTeams}
        eligibleGroups={eligibleGroups}
        availableTeams={availableTeams}
        users={allUsers}
      />

      <TeamsAssignmentPanel
        championshipId={id}
        selectionMode={championship.selectionMode}
        groups={groupsWithMeta}
        participants={championship.participants.map((p) => p.user)}
      />

      {unassigned === 0 && championship.status === "SETUP" && (
        <div className="mt-6">
          <StartGroupsButton
            championshipId={id}
            action={startGroupsAction}
          />
        </div>
      )}
    </PageEntrance>
  );
}
