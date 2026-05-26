"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runDrawAction, assignTeamAction } from "@/_actions/admin.actions";
import { Card } from "@/_components/ui/Card";
import { Button } from "@/_components/ui/Button";
import { ManualAssignmentTable } from "@/_components/admin/ManualAssignmentTable";
import type { SelectionMode } from "@/generated/prisma/client";

type TeamRow = {
  id: string;
  teamId: number;
  ownerUserId: string | null;
  team: { name: string; logoUrl: string };
  owner: { id: string; name: string } | null;
};

type GroupRow = {
  id: string;
  letter: string;
  teams: TeamRow[];
};

type Props = {
  championshipId: string;
  selectionMode: SelectionMode;
  groups: GroupRow[];
  participants: Array<{ id: string; name: string }>;
};

export function TeamsAssignmentPanel({
  championshipId,
  selectionMode,
  groups,
  participants,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const manualRows = groups.flatMap((group) =>
    group.teams.map((ct) => ({
      slotId: ct.id,
      groupLetter: group.letter,
      team: ct.team,
    })),
  );

  const assignments = Object.fromEntries(
    groups.flatMap((g) =>
      g.teams
        .filter((t) => t.ownerUserId)
        .map((t) => [t.id, t.ownerUserId!] as const),
    ),
  );

  if (selectionMode === "DRAW") {
    return (
      <Card>
        <p className="mb-4 text-sm text-muted">
          O sorteio distribui 1 seleção por grupo para cada participante.
        </p>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await runDrawAction(championshipId);
              setMessage(r.error ?? "Sorteio concluído!");
            })
          }
        >
          {pending ? "Sorteando..." : "Executar sorteio"}
        </Button>
        {message && <p className="mt-2 text-sm text-accent">{message}</p>}
        <GroupList groups={groups} />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Atribua cada seleção a um participante. Cada um só pode ter 1 time por
        grupo.
      </p>
      <ManualAssignmentTable
        rows={manualRows}
        participants={participants}
        assignments={assignments}
        onAssign={(slotId, ownerUserId) => {
          if (!ownerUserId) return;
          startTransition(async () => {
            const r = await assignTeamAction(slotId, ownerUserId);
            if (r.error) setMessage(r.error);
            else {
              setMessage("Atribuído!");
              router.refresh();
            }
          });
        }}
      />
      {message && <p className="text-sm text-accent">{message}</p>}
    </div>
  );
}

function GroupList({ groups }: { groups: GroupRow[] }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => (
        <div key={g.id} className="rounded-lg border border-border/50 p-3">
          <p className="mb-2 font-bold">Grupo {g.letter}</p>
          {g.teams.map((t) => (
            <p key={t.id} className="text-xs text-muted">
              {t.team.name} → {t.owner?.name ?? "—"}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
