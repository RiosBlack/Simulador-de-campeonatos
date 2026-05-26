"use client";

import { useState, useTransition } from "react";
import { Button } from "@/_components/ui/Button";

type SyncTeamsButtonProps = {
  action: () => Promise<{
    success?: boolean;
    count?: number;
    season?: number | null;
    warning?: string;
    error?: string;
  }>;
};

export function SyncTeamsButton({ action }: SyncTeamsButtonProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");

  return (
    <div>
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setWarning("");
            const result = await action();
            if (result.error) {
              setMessage(result.error);
              return;
            }
            const seasonLabel =
              result.season != null ? ` (temporada API ${result.season})` : "";
            setMessage(
              `${result.count ?? 0} seleções sincronizadas${seasonLabel}.`,
            );
            setWarning(result.warning ?? "");
          })
        }
      >
        {pending ? "Sincronizando..." : "Sincronizar seleções (API-Football)"}
      </Button>
      {message && <p className="mt-2 text-sm text-accent">{message}</p>}
      {warning && (
        <p className="mt-2 text-sm text-amber-200">{warning}</p>
      )}
    </div>
  );
}
