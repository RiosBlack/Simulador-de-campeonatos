"use client";

import Image from "next/image";
import { Button } from "@/_components/ui/Button";
import {
  type FormatSize,
  countFilledSlots,
  emptyGroupSlots,
  groupLettersForFormat,
  isGroupAssignmentComplete,
} from "@/_utils/championship-groups";

export type TeamOption = {
  id: number;
  name: string;
  code: string | null;
  logoUrl: string;
  country: string;
};

type Props = {
  teams: TeamOption[];
  formatSize: FormatSize;
  onFormatSizeChange: (size: FormatSize) => void;
  slots: Record<string, (number | null)[]>;
  onSlotsChange: (slots: Record<string, (number | null)[]>) => void;
  onBack: () => void;
  onNext: () => void;
};

export function GroupBuilderStep({
  teams,
  formatSize,
  onFormatSizeChange,
  slots,
  onSlotsChange,
  onBack,
  onNext,
}: Props) {
  const letters = groupLettersForFormat(formatSize);
  const filled = countFilledSlots(slots);
  const canProceed = isGroupAssignmentComplete(slots, formatSize);
  const canUse48 = teams.length >= 48;

  const usedIds = new Set(
    Object.values(slots)
      .flat()
      .filter((id): id is number => id !== null),
  );

  function setSlot(letter: string, index: number, teamId: number | null) {
    const group = [...(slots[letter] ?? [null, null, null, null])];
    group[index] = teamId;
    onSlotsChange({ ...slots, [letter]: group });
  }

  function clearGroup(letter: string) {
    onSlotsChange({
      ...slots,
      [letter]: [null, null, null, null],
    });
  }

  function suggestFill() {
    const available = teams
      .map((t) => t.id)
      .filter((id) => !usedIds.has(id));
    const next = { ...slots };
    let cursor = 0;

    for (const letter of letters) {
      const group = [...(next[letter] ?? [null, null, null, null])];
      for (let i = 0; i < 4; i++) {
        if (group[i] === null && available[cursor] !== undefined) {
          group[i] = available[cursor++]!;
        }
      }
      next[letter] = group;
    }
    onSlotsChange(next);
  }

  function handleFormatChange(size: FormatSize) {
    onFormatSizeChange(size);
    onSlotsChange(emptyGroupSlots(size));
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">3. Grupos e seleções</h2>
      <p className="text-sm text-muted">
        Escolha o formato e atribua 4 seleções a cada grupo. Cada seleção só
        pode aparecer uma vez.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleFormatChange(32)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium ${
            formatSize === 32
              ? "border-accent bg-accent/10"
              : "border-border hover:border-accent/30"
          }`}
        >
          32 seleções (8 grupos)
        </button>
        <button
          type="button"
          disabled={!canUse48}
          onClick={() => handleFormatChange(48)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
            formatSize === 48
              ? "border-accent bg-accent/10"
              : "border-border hover:border-accent/30"
          }`}
        >
          48 seleções (12 grupos)
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {filled}/{formatSize} seleções atribuídas
        </p>
        <Button type="button" variant="secondary" onClick={suggestFill}>
          Preencher sugestão
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {letters.map((letter) => (
          <div
            key={letter}
            className="rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-accent">Grupo {letter}</h3>
              <button
                type="button"
                onClick={() => clearGroup(letter)}
                className="text-xs text-muted hover:text-foreground"
              >
                Limpar
              </button>
            </div>
            {(slots[letter] ?? [null, null, null, null]).map((selectedId, i) => (
              <select
                key={`${letter}-${i}`}
                value={selectedId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSlot(letter, i, val ? Number(val) : null);
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {teams.map((team) => {
                  const isUsedElsewhere =
                    usedIds.has(team.id) && team.id !== selectedId;
                  return (
                    <option
                      key={team.id}
                      value={team.id}
                      disabled={isUsedElsewhere}
                    >
                      {team.name}
                      {team.code ? ` (${team.code})` : ""}
                    </option>
                  );
                })}
              </select>
            ))}
            <div className="flex flex-wrap gap-1 pt-1">
              {(slots[letter] ?? [])
                .filter((id): id is number => id !== null)
                .map((id) => {
                  const team = teams.find((t) => t.id === id);
                  if (!team) return null;
                  return (
                    <span
                      key={`${letter}-badge-${id}`}
                      className="inline-flex items-center gap-1 rounded bg-border/50 px-2 py-0.5 text-xs"
                    >
                      <Image
                        src={team.logoUrl}
                        alt=""
                        width={14}
                        height={14}
                        unoptimized
                      />
                      {team.code ?? team.name.slice(0, 3)}
                    </span>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Próximo
        </Button>
      </div>
    </div>
  );
}
