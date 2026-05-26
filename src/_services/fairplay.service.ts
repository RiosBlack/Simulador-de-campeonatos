import type { CardType } from "@/generated/prisma/client";

/** Pontos Fair Play FIFA — quanto maior, melhor (menos cartões). */
export const FAIR_PLAY_POINTS: Record<CardType, number> = {
  YELLOW: -1,
  SECOND_YELLOW: -3,
  DIRECT_RED: -4,
  YELLOW_THEN_RED: -5,
};

export function calculateFairPlayScore(
  cards: Array<{ type: CardType }>,
): number {
  return cards.reduce((sum, card) => sum + FAIR_PLAY_POINTS[card.type], 0);
}
