import {
  type FormatSize,
  groupLettersForFormat,
  isGroupAssignmentComplete,
} from "@/_utils/championship-groups";

export function manualSlotKey(groupLetter: string, teamId: number): string {
  return `${groupLetter}:${teamId}`;
}

export function buildManualAssignmentRows(
  groupSlots: Record<string, (number | null)[]>,
  formatSize: FormatSize,
  teamsById: Map<number, { name: string; logoUrl: string }>,
) {
  const letters = groupLettersForFormat(formatSize);
  const rows: Array<{
    slotId: string;
    groupLetter: string;
    team: { name: string; logoUrl: string };
  }> = [];

  for (const letter of letters) {
    for (const teamId of groupSlots[letter] ?? []) {
      if (teamId === null) continue;
      const team = teamsById.get(teamId);
      if (!team) continue;
      rows.push({
        slotId: manualSlotKey(letter, teamId),
        groupLetter: letter,
        team,
      });
    }
  }

  return rows;
}

export function isManualOwnerAssignmentComplete(
  groupSlots: Record<string, (number | null)[]>,
  formatSize: FormatSize,
  assignments: Record<string, string>,
): boolean {
  if (!isGroupAssignmentComplete(groupSlots, formatSize)) return false;

  const letters = groupLettersForFormat(formatSize);
  const ownersByGroup = new Map<string, Set<string>>();

  for (const letter of letters) {
    const group = groupSlots[letter] ?? [];
    for (const teamId of group) {
      if (teamId === null) return false;
      const ownerId = assignments[manualSlotKey(letter, teamId)];
      if (!ownerId) return false;

      const used = ownersByGroup.get(letter) ?? new Set();
      if (used.has(ownerId)) return false;
      used.add(ownerId);
      ownersByGroup.set(letter, used);
    }
  }

  return true;
}
