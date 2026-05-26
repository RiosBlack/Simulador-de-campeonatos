"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { runDrawAction, assignTeamAction } from "@/_actions/admin.actions";
import { Card } from "@/_components/ui/Card";
import { Button } from "@/_components/ui/Button";
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
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

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
    <div className="space-y-6">
      {groups.map((group) => (
        <Card key={group.id}>
          <h3 className="mb-3 font-bold text-accent">Grupo {group.letter}</h3>
          <div className="space-y-3">
            {group.teams.map((ct) => (
              <div
                key={ct.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 p-3"
              >
                <div className="flex items-center gap-2">
                  <Image
                    src={ct.team.logoUrl}
                    alt=""
                    width={28}
                    height={28}
                    unoptimized
                  />
                  <span className="text-sm font-medium">{ct.team.name}</span>
                </div>
                <select
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-sm"
                  value={ct.ownerUserId ?? ""}
                  onChange={(e) => {
                    const uid = e.target.value;
                    if (!uid) return;
                    startTransition(async () => {
                      const r = await assignTeamAction(ct.id, uid);
                      setMessage(r.error ?? "Atribuído!");
                    });
                  }}
                >
                  <option value="">Sem dono</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </Card>
      ))}
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
