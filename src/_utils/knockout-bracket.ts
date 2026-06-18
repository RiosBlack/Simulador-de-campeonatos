import type { FormatSize } from "@/_utils/championship-groups";

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

function winnerOf(descriptor: BracketSlotDescriptor): string {
  return `Venc. ${descriptor.home} vs ${descriptor.away}`;
}

/** R32 — Copa 2026 (12 grupos, 32 classificados). Slots 0–15 alinhados ao emparelhamento FIFA. */
const R32_BRACKET_48: BracketSlotDescriptor[] = [
  { home: secondPlace("A"), away: secondPlace("B") },
  { home: firstPlace("F"), away: secondPlace("C") },
  {
    home: firstPlace("E"),
    away: bestThirdPlace(["A", "B", "C", "D", "F"]),
  },
  {
    home: firstPlace("I"),
    away: bestThirdPlace(["C", "D", "F", "G", "H"]),
  },
  { home: firstPlace("C"), away: secondPlace("F") },
  { home: secondPlace("E"), away: secondPlace("I") },
  {
    home: firstPlace("A"),
    away: bestThirdPlace(["C", "E", "F", "H", "I"]),
  },
  {
    home: firstPlace("L"),
    away: bestThirdPlace(["E", "H", "I", "J", "K"]),
  },
  { home: secondPlace("K"), away: secondPlace("L") },
  { home: firstPlace("H"), away: secondPlace("J") },
  {
    home: firstPlace("D"),
    away: bestThirdPlace(["B", "E", "F", "I", "J"]),
  },
  {
    home: firstPlace("G"),
    away: bestThirdPlace(["A", "E", "H", "I", "J"]),
  },
  { home: firstPlace("J"), away: secondPlace("H") },
  { home: secondPlace("D"), away: secondPlace("G") },
  {
    home: firstPlace("B"),
    away: bestThirdPlace(["E", "F", "G", "I", "J"]),
  },
  {
    home: firstPlace("K"),
    away: bestThirdPlace(["D", "E", "I", "J", "L"]),
  },
];

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
    home: winnerOf(R32_BRACKET_48[0]!),
    away: winnerOf(R32_BRACKET_48[1]!),
  },
  {
    home: winnerOf(R32_BRACKET_48[2]!),
    away: winnerOf(R32_BRACKET_48[3]!),
  },
  {
    home: winnerOf(R32_BRACKET_48[4]!),
    away: winnerOf(R32_BRACKET_48[5]!),
  },
  {
    home: winnerOf(R32_BRACKET_48[6]!),
    away: winnerOf(R32_BRACKET_48[7]!),
  },
  {
    home: winnerOf(R32_BRACKET_48[8]!),
    away: winnerOf(R32_BRACKET_48[9]!),
  },
  {
    home: winnerOf(R32_BRACKET_48[10]!),
    away: winnerOf(R32_BRACKET_48[11]!),
  },
  {
    home: winnerOf(R32_BRACKET_48[12]!),
    away: winnerOf(R32_BRACKET_48[13]!),
  },
  {
    home: winnerOf(R32_BRACKET_48[14]!),
    away: winnerOf(R32_BRACKET_48[15]!),
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
    return R32_BRACKET_48[slot] ?? null;
  }
  if (stage === "R16") {
    const table = formatSize === 48 ? R16_BRACKET_48 : R16_BRACKET_32;
    return table[slot] ?? null;
  }
  return null;
}
