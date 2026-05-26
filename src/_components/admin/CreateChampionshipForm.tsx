"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChampionshipAction } from "@/_actions/admin.actions";
import { Button } from "@/_components/ui/Button";
import { Input } from "@/_components/ui/Input";

type UserOption = { id: string; name: string; email: string };

export function CreateChampionshipForm({ users }: { users: UserOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"DRAW" | "MANUAL">("DRAW");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleUser(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function submit() {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("selectionMode", mode);
    for (const id of selected) {
      formData.append("participantIds", id);
    }

    startTransition(async () => {
      const result = await createChampionshipAction(formData);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      if (result.id) {
        router.push(`/admin/championships/${result.id}/teams`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${step >= s ? "bg-accent" : "bg-border"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold">1. Dados da copa</h2>
          <Input
            placeholder="Nome da copa"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={() => name.length >= 3 && setStep(2)} disabled={name.length < 3}>
            Próximo
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold">2. Participantes</h2>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {users.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:border-accent/30"
              >
                <input
                  type="checkbox"
                  checked={selected.has(u.id)}
                  onChange={() => toggleUser(u.id)}
                />
                <span>
                  {u.name} <span className="text-muted">({u.email})</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button
              onClick={() => selected.size > 0 && setStep(3)}
              disabled={selected.size === 0}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-semibold">3. Modo de escolha</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("DRAW")}
              className={`rounded-xl border p-4 text-left ${mode === "DRAW" ? "border-accent bg-accent/10" : "border-border"}`}
            >
              <p className="font-semibold">Sorteio</p>
              <p className="text-sm text-muted">
                Distribui automaticamente respeitando 1 time por grupo
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode("MANUAL")}
              className={`rounded-xl border p-4 text-left ${mode === "MANUAL" ? "border-accent bg-accent/10" : "border-border"}`}
            >
              <p className="font-semibold">Escolha manual</p>
              <p className="text-sm text-muted">
                Admin atribui cada seleção a um participante
              </p>
            </button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Voltar
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? "Criando..." : "Criar copa"}
            </Button>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-red-300">{message}</p>}
    </div>
  );
}
