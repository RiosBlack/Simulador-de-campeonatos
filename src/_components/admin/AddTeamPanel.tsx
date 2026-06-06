"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { addChampionshipTeamAction } from "@/_actions/admin.actions";
import { Card } from "@/_components/ui/Card";
import { Button } from "@/_components/ui/Button";
import type { ChampStatus } from "@/generated/prisma/client";

type EligibleGroup = {
  id: string;
  letter: string;
  teamCount: number;
  ownersInGroup: string[];
};

type TeamOption = {
  id: number;
  name: string;
  logoUrl: string;
};

type UserOption = {
  id: string;
  name: string;
};

type Props = {
  championshipId: string;
  status: ChampStatus;
  totalTeams: number;
  maxTeams: number;
  eligibleGroups: EligibleGroup[];
  availableTeams: TeamOption[];
  users: UserOption[];
};

export function AddTeamPanel({
  championshipId,
  status,
  totalTeams,
  maxTeams,
  eligibleGroups,
  availableTeams,
  users,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [groupId, setGroupId] = useState(eligibleGroups[0]?.id ?? "");
  const [teamId, setTeamId] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");

  const selectedGroup = useMemo(
    () => eligibleGroups.find((g) => g.id === groupId),
    [eligibleGroups, groupId],
  );

  const ownersInSelectedGroup = useMemo(
    () => new Set(selectedGroup?.ownersInGroup ?? []),
    [selectedGroup],
  );

  const canShow =
    totalTeams < maxTeams &&
    ["SETUP", "GROUPS"].includes(status) &&
    eligibleGroups.length > 0;

  if (!canShow) return null;

  function submit() {
    setMessage("");
    setError("");

    if (!groupId || !teamId || !ownerUserId) {
      setError("Preencha grupo, seleção e jogador.");
      return;
    }

    startTransition(async () => {
      const result = await addChampionshipTeamAction(
        championshipId,
        groupId,
        Number(teamId),
        ownerUserId,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      const matchMsg =
        result.matchesCreated && result.matchesCreated > 0
          ? ` ${result.matchesCreated} jogo(s) criado(s).`
          : "";
      setMessage(`Seleção adicionada!${matchMsg}`);
      setTeamId("");
      setOwnerUserId("");
      router.refresh();
    });
  }

  return (
    <Card className="mb-6 border-accent/30">
      <h2 className="mb-1 font-bold text-accent">Adicionar seleção</h2>
      <p className="mb-4 text-sm text-muted">
        {totalTeams} / {maxTeams} seleções · complete grupos com vaga (máx. 4
        por grupo). Grupos com jogos lançados não aparecem aqui.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Grupo</span>
          <select
            className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            {eligibleGroups.map((g) => (
              <option key={g.id} value={g.id}>
                Grupo {g.letter} ({g.teamCount}/4)
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-muted">Seleção</span>
          <select
            className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">Escolher seleção...</option>
            {availableTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-muted">Jogador</span>
          <select
            className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm"
            value={ownerUserId}
            onChange={(e) => setOwnerUserId(e.target.value)}
          >
            <option value="">Escolher jogador...</option>
            {users.map((u) => {
              const usedInGroup = ownersInSelectedGroup.has(u.id);
              return (
                <option key={u.id} value={u.id} disabled={usedInGroup}>
                  {u.name}
                  {usedInGroup ? " (já tem time neste grupo)" : ""}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      {teamId && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted">
          {availableTeams
            .filter((t) => String(t.id) === teamId)
            .map((t) => (
              <span key={t.id} className="flex items-center gap-2">
                <Image
                  src={t.logoUrl}
                  alt=""
                  width={24}
                  height={24}
                  unoptimized
                />
                {t.name}
              </span>
            ))}
        </div>
      )}

      <Button className="mt-4" disabled={pending} onClick={submit}>
        {pending ? "Adicionando..." : "Adicionar seleção"}
      </Button>

      {message && <p className="mt-2 text-sm text-accent">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </Card>
  );
}
