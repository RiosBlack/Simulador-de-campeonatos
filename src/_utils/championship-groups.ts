export const GROUP_LETTERS_32 = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
export const GROUP_LETTERS_48 = [
  ...GROUP_LETTERS_32,
  "I",
  "J",
  "K",
  "L",
] as const;

export type FormatSize = 32 | 48;

export function groupLettersForFormat(formatSize: FormatSize): readonly string[] {
  return formatSize === 48 ? GROUP_LETTERS_48 : GROUP_LETTERS_32;
}

export function emptyGroupSlots(
  formatSize: FormatSize,
): Record<string, (number | null)[]> {
  const letters = groupLettersForFormat(formatSize);
  return Object.fromEntries(letters.map((letter) => [letter, [null, null, null, null]]));
}

export function countFilledSlots(
  slots: Record<string, (number | null)[]>,
): number {
  return Object.values(slots).reduce(
    (sum, group) => sum + group.filter((id) => id !== null).length,
    0,
  );
}

export function isGroupAssignmentComplete(
  slots: Record<string, (number | null)[]>,
  formatSize: FormatSize,
): boolean {
  const expected = formatSize;
  const letters = groupLettersForFormat(formatSize);
  if (countFilledSlots(slots) !== expected) return false;

  const used = new Set<number>();
  for (const letter of letters) {
    const group = slots[letter];
    if (!group || group.length !== 4) return false;
    for (const id of group) {
      if (id === null || used.has(id)) return false;
      used.add(id);
    }
  }
  return used.size === expected;
}
