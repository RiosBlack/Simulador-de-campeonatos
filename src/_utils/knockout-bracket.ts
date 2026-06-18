import type { FormatSize } from "@/_utils/championship-groups";

export type BracketSlotSide =
  | { kind: "group"; group: string; position: 1 | 2 }
  | { kind: "third"; groups: string[] };

export type BracketSlotDefinition = {
  home: BracketSlotSide;
  away: BracketSlotSide;
};

export type BracketSlotDescriptor = {
  home: string;
  away: string;
};

function firstPlace(group: string): string {
  return `1º do Grupo ${group}`;
}

function secondPlace(group: string): string {
  return `2º do Grupo ${group}`;
}

function bestThirdPlace(groups: string[]): string {
  if (groups.length === 1) {
    return `3º do Grupo ${groups[0]}`;
  }
  const list =
    groups.length === 2
      ? `${groups[0]} ou ${groups[1]}`
      : `${groups.slice(0, -1).join(", ")} ou ${groups[groups.length - 1]}`;
  return `Melhor 3º (${list})`;
}

export function bracketSideLabel(side: BracketSlotSide): string {
  if (side.kind === "group") {
    return side.position === 1
      ? firstPlace(side.group)
      : secondPlace(side.group);
  }
  return bestThirdPlace(side.groups);
}

function descriptorFromDefinition(def: BracketSlotDefinition): BracketSlotDescriptor {
  return {
    home: bracketSideLabel(def.home),
    away: bracketSideLabel(def.away),
  };
}

function winnerOf(descriptor: BracketSlotDescriptor): string {
  return `Venc. ${descriptor.home} vs ${descriptor.away}`;
}

/** R32 — Copa 2026 (12 grupos, 32 classificados). Slots 0–15 alinhados ao emparelhamento FIFA. */
export const R32_BRACKET_48: BracketSlotDefinition[] = [
  {
    home: { kind: "group", group: "A", position: 2 },
    away: { kind: "group", group: "B", position: 2 },
  },
  {
    home: { kind: "group", group: "F", position: 1 },
    away: { kind: "group", group: "C", position: 2 },
  },
  {
    home: { kind: "group", group: "E", position: 1 },
    away: { kind: "third", groups: ["A", "B", "C", "D", "F"] },
  },
  {
    home: { kind: "group", group: "I", position: 1 },
    away: { kind: "third", groups: ["C", "D", "F", "G", "H"] },
  },
  {
    home: { kind: "group", group: "C", position: 1 },
    away: { kind: "group", group: "F", position: 2 },
  },
  {
    home: { kind: "group", group: "E", position: 2 },
    away: { kind: "group", group: "I", position: 2 },
  },
  {
    home: { kind: "group", group: "A", position: 1 },
    away: { kind: "third", groups: ["C", "E", "F", "H", "I"] },
  },
  {
    home: { kind: "group", group: "L", position: 1 },
    away: { kind: "third", groups: ["E", "H", "I", "J", "K"] },
  },
  {
    home: { kind: "group", group: "K", position: 2 },
    away: { kind: "group", group: "L", position: 2 },
  },
  {
    home: { kind: "group", group: "H", position: 1 },
    away: { kind: "group", group: "J", position: 2 },
  },
  {
    home: { kind: "group", group: "D", position: 1 },
    away: { kind: "third", groups: ["B", "E", "F", "I", "J"] },
  },
  {
    home: { kind: "group", group: "G", position: 1 },
    away: { kind: "third", groups: ["A", "E", "H", "I", "J"] },
  },
  {
    home: { kind: "group", group: "J", position: 1 },
    away: { kind: "group", group: "H", position: 2 },
  },
  {
    home: { kind: "group", group: "D", position: 2 },
    away: { kind: "group", group: "G", position: 2 },
  },
  {
    home: { kind: "group", group: "B", position: 1 },
    away: { kind: "third", groups: ["E", "F", "G", "I", "J"] },
  },
  {
    home: { kind: "group", group: "K", position: 1 },
    away: { kind: "third", groups: ["D", "E", "I", "J", "L"] },
  },
];

const R32_BRACKET_48_DESCRIPTORS = R32_BRACKET_48.map(descriptorFromDefinition);

/** Oitavas — formato 32 seleções (8 grupos, 16 classificados). */
const R16_BRACKET_32: BracketSlotDescriptor[] = [
  { home: secondPlace("A"), away: secondPlace("B") },
  { home: firstPlace("E"), away: secondPlace("F") },
  { home: firstPlace("G"), away: secondPlace("H") },
  { home: firstPlace("C"), away: secondPlace("D") },
  { home: firstPlace("D"), away: secondPlace("C") },
  { home: firstPlace("F"), away: secondPlace("E") },
  { home: firstPlace("H"), away: secondPlace("G") },
  { home: firstPlace("B"), away: secondPlace("A") },
];

/** Oitavas — formato 48 seleções (vencedores dos 16-avos, slots 0–7). */
const R16_BRACKET_48: BracketSlotDescriptor[] = [
  {
    home: winnerOf(R32_BRACKET_48_DESCRIPTORS[0]!),
    away: winnerOf(R32_BRACKET_48_DESCRIPTORS[1]!),
  },
  {
    home: winnerOf(R32_BRACKET_48_DESCRIPTORS[2]!),
    away: winnerOf(R32_BRACKET_48_DESCRIPTORS[3]!),
  },
  {
    home: winnerOf(R32_BRACKET_48_DESCRIPTORS[4]!),
    away: winnerOf(R32_BRACKET_48_DESCRIPTORS[5]!),
  },
  {
    home: winnerOf(R32_BRACKET_48_DESCRIPTORS[6]!),
    away: winnerOf(R32_BRACKET_48_DESCRIPTORS[7]!),
  },
  {
    home: winnerOf(R32_BRACKET_48_DESCRIPTORS[8]!),
    away: winnerOf(R32_BRACKET_48_DESCRIPTORS[9]!),
  },
  {
    home: winnerOf(R32_BRACKET_48_DESCRIPTORS[10]!),
    away: winnerOf(R32_BRACKET_48_DESCRIPTORS[11]!),
  },
  {
    home: winnerOf(R32_BRACKET_48_DESCRIPTORS[12]!),
    away: winnerOf(R32_BRACKET_48_DESCRIPTORS[13]!),
  },
  {
    home: winnerOf(R32_BRACKET_48_DESCRIPTORS[14]!),
    away: winnerOf(R32_BRACKET_48_DESCRIPTORS[15]!),
  },
];

export function inferFormatSize(groupCount: number): FormatSize {
  return groupCount >= 12 ? 48 : 32;
}

export function knockoutStagesForFormat(
  formatSize: FormatSize,
): readonly ("R32" | "R16" | "QF" | "SF" | "FINAL")[] {
  return formatSize === 48
    ? (["R32", "R16", "QF", "SF", "FINAL"] as const)
    : (["R16", "QF", "SF", "FINAL"] as const);
}

export function slotsPerKnockoutStage(
  formatSize: FormatSize,
): Record<string, number> {
  return formatSize === 48
    ? { R32: 16, R16: 8, QF: 4, SF: 2, FINAL: 1 }
    : { R16: 8, QF: 4, SF: 2, FINAL: 1 };
}

export function getBracketSlotDescriptor(
  formatSize: FormatSize,
  stage: string,
  slot: number,
): BracketSlotDescriptor | null {
  if (stage === "R32" && formatSize === 48) {
    return R32_BRACKET_48_DESCRIPTORS[slot] ?? null;
  }
  if (stage === "R16") {
    const table = formatSize === 48 ? R16_BRACKET_48 : R16_BRACKET_32;
    return table[slot] ?? null;
  }
  return null;
}
