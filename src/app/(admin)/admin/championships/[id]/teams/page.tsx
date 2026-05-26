import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/_lib/session";
import prisma from "@/_lib/prisma";
import { Card } from "@/_components/ui/Card";
import { PageEntrance } from "@/_components/anim/PageEntrance";
import { TeamsAssignmentPanel } from "@/_components/admin/TeamsAssignmentPanel";
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
      <p className="mb-6 text-sm text-muted">
        Modo: {championship.selectionMode} · {unassigned} times sem dono
      </p>

      <TeamsAssignmentPanel
        championshipId={id}
        selectionMode={championship.selectionMode}
        groups={championship.groups}
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
