import type { CardType } from "@/generated/prisma/client";

type MatchEventRow = { teamId: number; type: CardType };

export function countMatchCards(
  events: MatchEventRow[],
  teamId: number,
): { yellow: number; red: number } {
  let yellow = 0;
  let red = 0;
  for (const e of events) {
    if (e.teamId !== teamId) continue;
    if (e.type === "YELLOW") yellow++;
    else if (e.type === "DIRECT_RED" || e.type === "SECOND_YELLOW") red++;
  }
  return { yellow, red };
}
