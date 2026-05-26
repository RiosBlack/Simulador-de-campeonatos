export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    GROUP: "Fase de Grupos",
    R32: "16-avos",
    R16: "Oitavas",
    QF: "Quartas",
    SF: "Semifinal",
    FINAL: "Final",
    THIRD_PLACE: "3º lugar",
  };
  return labels[stage] ?? stage;
}

export function groupLetters(): string[] {
  return "ABCDEFGHIJKL".split("");
}
