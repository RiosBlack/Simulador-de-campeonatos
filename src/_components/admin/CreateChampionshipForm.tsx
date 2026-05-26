"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChampionshipAction } from "@/_actions/admin.actions";
import { Button } from "@/_components/ui/Button";
import { Input } from "@/_components/ui/Input";
import {
  GroupBuilderStep,
  type TeamOption,
} from "@/_components/admin/GroupBuilderStep";
import { ManualAssignmentTable } from "@/_components/admin/ManualAssignmentTable";
import {
  type FormatSize,
  emptyGroupSlots,
  groupLettersForFormat,
} from "@/_utils/championship-groups";
import {
  buildManualAssignmentRows,
  isManualOwnerAssignmentComplete,
  manualSlotKey,
} from "@/_utils/manual-assignment";

type UserOption = { id: string; name: string; email: string };

export function CreateChampionshipForm({
  users,
  teams,
}: {
  users: UserOption[];
  teams: TeamOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"DRAW" | "MANUAL">("DRAW");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formatSize, setFormatSize] = useState<FormatSize>(32);
  const [groupSlots, setGroupSlots] = useState(() => emptyGroupSlots(32));
  const [ownerAssignments, setOwnerAssignments] = useState<
    Record<string, string>
  >({});

  const teamsById = useMemo(
    () =>
      new Map(
        teams.map((t) => [t.id, { name: t.name, logoUrl: t.logoUrl }] as const),
      ),
    [teams],
  );

  const selectedParticipants = useMemo(
    () => users.filter((u) => selected.has(u.id)),
    [users, selected],
  );

  const manualRows = useMemo(
    () => buildManualAssignmentRows(groupSlots, formatSize, teamsById),
    [groupSlots, formatSize, teamsById],
  );

  const manualComplete =
    mode === "MANUAL" &&
    isManualOwnerAssignmentComplete(groupSlots, formatSize, ownerAssignments);

  function toggleUser(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    setOwnerAssignments({});
  }

  function setOwner(slotId: string, ownerUserId: string) {
    setOwnerAssignments((prev) => {
      const next = { ...prev };
      if (!ownerUserId) delete next[slotId];
      else next[slotId] = ownerUserId;
      return next;
    });
  }

  function submit() {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("selectionMode", mode);
    formData.set("formatSize", String(formatSize));
    for (const id of selected) {
      formData.append("participantIds", id);
    }

    const letters = groupLettersForFormat(formatSize);
    for (const letter of letters) {
      const group = groupSlots[letter] ?? [];
      for (const teamId of group) {
        if (teamId !== null) {
          formData.append("groupAssignments", `${letter}:${teamId}`);
          const ownerId = ownerAssignments[manualSlotKey(letter, teamId)];
          if (ownerId) {
            formData.append(
              "ownerAssignments",
              `${letter}:${teamId}:${ownerId}`,
            );
          }
        }
      }
    }

    startTransition(async () => {
      const result = await createChampionshipAction(formData);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      if (result.id) {
        router.push(`/admin/championships/${result.id}/teams`);
      }
    });
  }

  const canOpenGroupStep = teams.length >= 32;
  const canSubmit =
    mode === "DRAW" || (mode === "MANUAL" && manualComplete);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${step >= s ? "bg-accent" : "bg-border"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold">1. Dados da copa</h2>
          <Input
            placeholder="Nome da copa"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={() => name.length >= 3 && setStep(2)} disabled={name.length < 3}>
            Próximo
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold">2. Participantes</h2>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {users.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:border-accent/30"
              >
                <input
                  type="checkbox"
                  checked={selected.has(u.id)}
                  onChange={() => toggleUser(u.id)}
                />
                <span>
                  {u.name} <span className="text-muted">({u.email})</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button
              onClick={() => selected.size > 0 && canOpenGroupStep && setStep(3)}
              disabled={selected.size === 0 || !canOpenGroupStep}
            >
              Próximo
            </Button>
          </div>
          {!canOpenGroupStep && (
            <p className="text-sm text-amber-200">
              Sincronize ao menos 32 seleções antes de montar os grupos.
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <GroupBuilderStep
          teams={teams}
          formatSize={formatSize}
          onFormatSizeChange={(size) => {
            setFormatSize(size);
            setOwnerAssignments({});
          }}
          slots={groupSlots}
          onSlotsChange={(slots) => {
            setGroupSlots(slots);
            setOwnerAssignments({});
          }}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-semibold">4. Modo de escolha</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("DRAW")}
              className={`rounded-xl border p-4 text-left ${mode === "DRAW" ? "border-accent bg-accent/10" : "border-border"}`}
            >
              <p className="font-semibold">Sorteio</p>
              <p className="text-sm text-muted">
                Distribui automaticamente respeitando 1 time por grupo
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode("MANUAL")}
              className={`rounded-xl border p-4 text-left ${mode === "MANUAL" ? "border-accent bg-accent/10" : "border-border"}`}
            >
              <p className="font-semibold">Escolha manual</p>
              <p className="text-sm text-muted">
                Atribua cada seleção a um participante abaixo
              </p>
            </button>
          </div>

          {mode === "MANUAL" && (
            <div className="space-y-3 border-t border-border pt-4">
              <div>
                <h3 className="font-semibold">Atribuir seleções</h3>
                <p className="text-sm text-muted">
                  Cada participante pode ter no máximo 1 seleção por grupo.
                </p>
              </div>
              <ManualAssignmentTable
                rows={manualRows}
                participants={selectedParticipants}
                assignments={ownerAssignments}
                onAssign={setOwner}
              />
              {!manualComplete && manualRows.length > 0 && (
                <p className="text-sm text-amber-200">
                  Preencha o participante de todas as seleções antes de criar a
                  copa.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(3)}>
              Voltar
            </Button>
            <Button onClick={submit} disabled={pending || !canSubmit}>
              {pending ? "Criando..." : "Criar copa"}
            </Button>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-red-300">{message}</p>}
    </div>
  );
}
