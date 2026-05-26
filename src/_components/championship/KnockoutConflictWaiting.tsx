import { Card } from "@/_components/ui/Card";
import { stageLabel } from "@/_utils/format";

export type WaitingKnockoutConflict = {
  matchId: string;
  stage: string;
  homeName: string;
  awayName: string;
  ownerName: string;
};

type Props = {
  conflicts: WaitingKnockoutConflict[];
};

export function KnockoutConflictWaiting({ conflicts }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {conflicts.map((c) => (
        <Card
          key={c.matchId}
          className="border-amber-500/30 bg-amber-500/5 p-4"
        >
          <p className="text-sm text-amber-100/90">
            Aguardando <strong>{c.ownerName}</strong> escolher qual seleção segue
            em {stageLabel(c.stage)} ({c.homeName} vs {c.awayName}).
          </p>
        </Card>
      ))}
    </div>
  );
}
