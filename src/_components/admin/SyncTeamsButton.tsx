"use client";

import { useState, useTransition } from "react";
import { Button } from "@/_components/ui/Button";

type SyncTeamsButtonProps = {
  action: () => Promise<{ success?: boolean; count?: number; error?: string }>;
};

export function SyncTeamsButton({ action }: SyncTeamsButtonProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div>
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await action();
            if (result.error) setMessage(result.error);
            else setMessage(`${result.count ?? 0} seleções sincronizadas!`);
          })
        }
      >
        {pending ? "Sincronizando..." : "Sincronizar seleções (API-Football)"}
      </Button>
      {message && <p className="mt-2 text-sm text-accent">{message}</p>}
    </div>
  );
}
