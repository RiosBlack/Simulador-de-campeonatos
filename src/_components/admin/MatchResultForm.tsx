"use client";

import { useTransition } from "react";
import { saveMatchResultAction } from "@/_actions/admin.actions";
import { Button } from "@/_components/ui/Button";
import { Input } from "@/_components/ui/Input";

type Props = {
  matchId: string;
  isKnockout: boolean;
  defaultHome: number;
  defaultAway: number;
  played: boolean;
};

export function MatchResultForm({
  matchId,
  isKnockout,
  defaultHome,
  defaultAway,
  played,
}: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await saveMatchResultAction(formData);
        })
      }
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="matchId" value={matchId} />
      <div>
        <label className="text-xs text-muted">Gols casa</label>
        <Input
          name="homeScore"
          type="number"
          min={0}
          max={99}
          defaultValue={defaultHome}
        />
      </div>
      <div>
        <label className="text-xs text-muted">Gols fora</label>
        <Input
          name="awayScore"
          type="number"
          min={0}
          max={99}
          defaultValue={defaultAway}
        />
      </div>
      {isKnockout && (
        <>
          <div>
            <label className="text-xs text-muted">Pênaltis casa</label>
            <Input name="homeScorePen" type="number" min={0} defaultValue={0} />
          </div>
          <div>
            <label className="text-xs text-muted">Pênaltis fora</label>
            <Input name="awayScorePen" type="number" min={0} defaultValue={0} />
          </div>
        </>
      )}
      <div>
        <label className="text-xs text-muted">Amarelos casa</label>
        <Input name="yellowHome" type="number" min={0} defaultValue={0} />
      </div>
      <div>
        <label className="text-xs text-muted">Amarelos fora</label>
        <Input name="yellowAway" type="number" min={0} defaultValue={0} />
      </div>
      <div>
        <label className="text-xs text-muted">Vermelhos casa</label>
        <Input name="redHome" type="number" min={0} defaultValue={0} />
      </div>
      <div>
        <label className="text-xs text-muted">Vermelhos fora</label>
        <Input name="redAway" type="number" min={0} defaultValue={0} />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Salvando..." : played ? "Atualizar" : "Registrar"}
        </Button>
      </div>
    </form>
  );
}
