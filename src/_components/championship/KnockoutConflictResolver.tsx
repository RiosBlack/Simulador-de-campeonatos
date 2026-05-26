"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import {
  resolveKnockoutConflictAction,
  type ResolveKnockoutConflictState,
} from "@/_actions/knockout.actions";
import { Button } from "@/_components/ui/Button";
import { Card } from "@/_components/ui/Card";
import { stageLabel } from "@/_utils/format";

export type OwnerKnockoutConflict = {
  matchId: string;
  stage: string;
  homeTeamId: number;
  awayTeamId: number;
  homeName: string;
  awayName: string;
  homeLogo: string;
  awayLogo: string;
};

type Props = {
  conflicts: OwnerKnockoutConflict[];
};

export function KnockoutConflictResolver({ conflicts }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      {conflicts.map((conflict) => (
        <ConflictCard key={conflict.matchId} conflict={conflict} />
      ))}
    </div>
  );
}

function ConflictCard({ conflict }: { conflict: OwnerKnockoutConflict }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ResolveKnockoutConflictState>({});

  function choose(teamId: number) {
    const formData = new FormData();
    formData.set("matchId", conflict.matchId);
    formData.set("chosenTeamId", String(teamId));

    startTransition(async () => {
      const result = await resolveKnockoutConflictAction({}, formData);
      setState(result);
    });
  }

  if (state.success) {
    return (
      <Card className="border-accent/40 bg-accent/5 p-4">
        <p className="text-sm text-accent">
          Escolha registrada. Stand-in sorteado:{" "}
          <strong>{state.standInName}</strong> assumirá a outra seleção em{" "}
          {stageLabel(conflict.stage)} ({conflict.homeName} vs {conflict.awayName}
          ).
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/40 bg-amber-500/10 p-4">
      <p className="mb-1 text-sm font-semibold text-amber-200">
        Confronto entre suas seleções — {stageLabel(conflict.stage)}
      </p>
      <p className="mb-4 text-sm text-muted">
        Você possui as duas seleções deste jogo. Escolha qual deseja seguir no
        mata-mata. A outra entrará em sorteio automático entre os demais
        participantes.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <TeamChoiceButton
          name={conflict.homeName}
          logo={conflict.homeLogo}
          disabled={pending}
          onClick={() => choose(conflict.homeTeamId)}
        />
        <TeamChoiceButton
          name={conflict.awayName}
          logo={conflict.awayLogo}
          disabled={pending}
          onClick={() => choose(conflict.awayTeamId)}
        />
      </div>
      {state.error && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {state.error}
        </p>
      )}
      {pending && (
        <p className="mt-2 text-xs text-muted">Sorteando stand-in...</p>
      )}
    </Card>
  );
}

function TeamChoiceButton({
  name,
  logo,
  disabled,
  onClick,
}: {
  name: string;
  logo: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={disabled}
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-2 py-3"
    >
      <Image src={logo} alt="" width={28} height={28} unoptimized />
      <span>Seguir com {name}</span>
    </Button>
  );
}
