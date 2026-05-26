"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeAccountSetupAction } from "@/_actions/admin.actions";
import { getAuthClient } from "@/_lib/auth-client";
import { Button } from "@/_components/ui/Button";
import { Input } from "@/_components/ui/Input";
import { Card } from "@/_components/ui/Card";

type SetupAccountFormProps = {
  token: string;
  userName: string;
};

export function SetupAccountForm({ token, userName }: SetupAccountFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.set("token", token);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);

    try {
      const result = await completeAccountSetupAction(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      const { error: signInError } = await getAuthClient().signIn.email({
        email: result.email!,
        password,
      });

      if (signInError) {
        router.push("/login");
        router.refresh();
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card glow className="space-y-6">
      <div className="text-center">
        <p className="text-4xl">⚽</p>
        <h1 className="mt-2 text-2xl font-bold text-gradient">Definir acesso</h1>
        <p className="mt-1 text-sm text-muted">
          Olá, <span className="text-foreground">{userName}</span>. Cadastre seu
          e-mail e senha para entrar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-muted">E-mail</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted">Senha</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted">
            Confirmar senha
          </label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Salvando..." : "Salvar e entrar"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted">
        Este link expira em 24 horas ou após o primeiro uso.
      </p>
    </Card>
  );
}
