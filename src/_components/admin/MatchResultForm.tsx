"use client";

import { useState, useTransition } from "react";
import {
  registerMatchResultAction,
  updateMatchResultAction,
} from "@/_actions/admin.actions";
import { Button } from "@/_components/ui/Button";
import { Input } from "@/_components/ui/Input";

type Props = {
  matchId: string;
  mode: "register" | "update";
  isKnockout: boolean;
  defaultHome: number;
  defaultAway: number;
  defaultHomePen?: number;
  defaultAwayPen?: number;
  defaultYellowHome?: number;
  defaultYellowAway?: number;
  defaultRedHome?: number;
  defaultRedAway?: number;
};

export function MatchResultForm({
  matchId,
  mode,
  isKnockout,
  defaultHome,
  defaultAway,
  defaultHomePen = 0,
  defaultAwayPen = 0,
  defaultYellowHome = 0,
  defaultYellowAway = 0,
  defaultRedHome = 0,
  defaultRedAway = 0,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const action =
    mode === "register" ? registerMatchResultAction : updateMatchResultAction;
  const submitLabel = mode === "register" ? "Registrar" : "Atualizar";
  const pendingLabel = mode === "register" ? "Registrando..." : "Atualizando...";

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          setMessage("");
          const result = await action(formData);
          if (result?.error) {
            setMessage(result.error);
          }
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
          required
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
          required
        />
      </div>
      {isKnockout && (
        <>
          <div>
            <label className="text-xs text-muted">Pênaltis casa</label>
            <Input
              name="homeScorePen"
              type="number"
              min={0}
              defaultValue={defaultHomePen}
            />
          </div>
          <div>
            <label className="text-xs text-muted">Pênaltis fora</label>
            <Input
              name="awayScorePen"
              type="number"
              min={0}
              defaultValue={defaultAwayPen}
            />
          </div>
        </>
      )}
      <div>
        <label className="text-xs text-muted">Amarelos casa</label>
        <Input
          name="yellowHome"
          type="number"
          min={0}
          defaultValue={defaultYellowHome}
        />
      </div>
      <div>
        <label className="text-xs text-muted">Amarelos fora</label>
        <Input
          name="yellowAway"
          type="number"
          min={0}
          defaultValue={defaultYellowAway}
        />
      </div>
      <div>
        <label className="text-xs text-muted">Vermelhos casa</label>
        <Input
          name="redHome"
          type="number"
          min={0}
          defaultValue={defaultRedHome}
        />
      </div>
      <div>
        <label className="text-xs text-muted">Vermelhos fora</label>
        <Input
          name="redAway"
          type="number"
          min={0}
          defaultValue={defaultRedAway}
        />
      </div>
      <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? pendingLabel : submitLabel}
        </Button>
        {message && (
          <p className="text-sm text-red-300" role="alert">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
