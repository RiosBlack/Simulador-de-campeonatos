"use client";

import { useState } from "react";
import { Button } from "@/_components/ui/Button";

type SetupLinkDisplayProps = {
  setupUrl: string;
  onDismiss?: () => void;
};

export function SetupLinkDisplay({ setupUrl, onDismiss }: SetupLinkDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(setupUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-accent/30 bg-surface p-4">
      <p className="mb-2 text-sm font-medium text-foreground">
        Link de cadastro (válido por 24h)
      </p>
      <p className="break-all text-xs text-muted">{setupUrl}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={handleCopy}>
          {copied ? "Copiado!" : "Copiar link"}
        </Button>
        {onDismiss && (
          <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
            Fechar
          </Button>
        )}
      </div>
    </div>
  );
}
