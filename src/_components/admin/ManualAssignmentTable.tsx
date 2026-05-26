"use client";

import Image from "next/image";
import { Card } from "@/_components/ui/Card";

export type ManualAssignmentRow = {
  slotId: string;
  groupLetter: string;
  team: { name: string; logoUrl: string };
};

type ParticipantOption = { id: string; name: string };

type Props = {
  rows: ManualAssignmentRow[];
  participants: ParticipantOption[];
  assignments: Record<string, string>;
  onAssign: (slotId: string, ownerUserId: string) => void;
};

export function ManualAssignmentTable({
  rows,
  participants,
  assignments,
  onAssign,
}: Props) {
  const byGroup = rows.reduce<Map<string, ManualAssignmentRow[]>>((map, row) => {
    const list = map.get(row.groupLetter) ?? [];
    list.push(row);
    map.set(row.groupLetter, list);
    return map;
  }, new Map());

  const sortedGroups = [...byGroup.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <div className="max-h-[min(60vh,520px)] space-y-4 overflow-y-auto pr-1">
      {sortedGroups.map(([letter, groupRows]) => {
        const ownersInGroup = new Set(
          groupRows
            .map((r) => assignments[r.slotId])
            .filter((id): id is string => Boolean(id)),
        );

        return (
          <Card key={letter}>
            <h3 className="mb-3 font-bold text-accent">Grupo {letter}</h3>
            <div className="space-y-3">
              {groupRows.map((row) => {
                const currentOwner = assignments[row.slotId] ?? "";
                return (
                  <div
                    key={row.slotId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={row.team.logoUrl}
                        alt=""
                        width={28}
                        height={28}
                        unoptimized
                      />
                      <span className="text-sm font-medium">{row.team.name}</span>
                    </div>
                    <select
                      className="min-w-[10rem] rounded-lg border border-border bg-surface px-2 py-1 text-sm"
                      value={currentOwner}
                      onChange={(e) => onAssign(row.slotId, e.target.value)}
                    >
                      <option value="">Escolher participante...</option>
                      {participants.map((p) => {
                        const usedElsewhere =
                          ownersInGroup.has(p.id) && p.id !== currentOwner;
                        return (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={usedElsewhere}
                          >
                            {p.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
