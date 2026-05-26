"use client";

import { useState, useTransition } from "react";
import { createUserAction } from "@/_actions/admin.actions";
import { Button } from "@/_components/ui/Button";
import { Input } from "@/_components/ui/Input";

export function CreateUserForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const result = await createUserAction(formData);
          if (result.error) setMessage(result.error);
          else setMessage("Usuário criado com sucesso!");
        })
      }
      className="grid gap-4 sm:grid-cols-2"
    >
      <Input name="name" placeholder="Nome" required />
      <Input name="email" type="email" placeholder="E-mail" required />
      <Input
        name="password"
        type="password"
        placeholder="Senha (mín. 8)"
        required
        minLength={8}
      />
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
        {message && <p className="mt-2 text-sm text-accent">{message}</p>}
      </div>
    </form>
  );
}
