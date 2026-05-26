"use client";

import { useState, useTransition } from "react";
import { regenerateCredentialLinkAction } from "@/_actions/admin.actions";
import { Button } from "@/_components/ui/Button";
import { SetupLinkDisplay } from "@/_components/admin/SetupLinkDisplay";

type RegenerateCredentialLinkButtonProps = {
  userId: string;
  credentialSetupComplete: boolean;
};

export function RegenerateCredentialLinkButton({
  userId,
  credentialSetupComplete,
}: RegenerateCredentialLinkButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [setupUrl, setSetupUrl] = useState<string | null>(null);

  const label = credentialSetupComplete
    ? "Novo link de acesso"
    : "Gerar link de acesso";

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError("");
            setSetupUrl(null);
            const result = await regenerateCredentialLinkAction(userId);
            if (result.error) {
              setError(result.error);
              return;
            }
            if (result.setupUrl) setSetupUrl(result.setupUrl);
          })
        }
      >
        {pending ? "Gerando..." : label}
      </Button>
      {error && <p className="text-xs text-red-300">{error}</p>}
      {setupUrl && (
        <div className="w-full min-w-[280px] max-w-md">
          <SetupLinkDisplay
            setupUrl={setupUrl}
            onDismiss={() => setSetupUrl(null)}
          />
        </div>
      )}
    </div>
  );
}
