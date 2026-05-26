"use client";

import { useRef, useState, useTransition } from "react";
import { createUserAction } from "@/_actions/admin.actions";
import { Button } from "@/_components/ui/Button";
import { Input } from "@/_components/ui/Input";
import { SetupLinkDisplay } from "@/_components/admin/SetupLinkDisplay";

export function CreateUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [setupUrl, setSetupUrl] = useState<string | null>(null);

  return (
    <div>
      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            setMessage("");
            setSetupUrl(null);
            const result = await createUserAction(formData);
            if (result.error) {
              setMessage(result.error);
              return;
            }
            setMessage("Usuário criado! Envie o link abaixo para a pessoa definir e-mail e senha.");
            if (result.setupUrl) setSetupUrl(result.setupUrl);
            formRef.current?.reset();
          })
        }
        className="grid gap-4 sm:grid-cols-2"
      >
        <Input name="name" placeholder="Nome" required />
        <select
          name="role"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-foreground"
          defaultValue="MEMBER"
        >
          <option value="MEMBER">Membro</option>
          <option value="ADMIN">Admin</option>
        </select>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Criando..." : "Criar usuário"}
          </Button>
          {message && (
            <p className="mt-2 text-sm text-accent">{message}</p>
          )}
        </div>
      </form>
      {setupUrl && (
        <SetupLinkDisplay
          setupUrl={setupUrl}
          onDismiss={() => setSetupUrl(null)}
        />
      )}
    </div>
  );
}
