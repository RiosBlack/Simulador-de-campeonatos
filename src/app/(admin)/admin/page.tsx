import Link from "next/link";
import { Card } from "@/_components/ui/Card";
import { PageEntrance } from "@/_components/anim/PageEntrance";
import { syncTeamsAction } from "@/_actions/admin.actions";
import { SyncTeamsButton } from "@/_components/admin/SyncTeamsButton";
import prisma from "@/_lib/prisma";

export default async function AdminPage() {
  const [users, teams, championships] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
    prisma.championship.count(),
  ]);

  return (
    <PageEntrance>
      <h1 className="mb-6 text-2xl font-bold">Painel Admin</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-3xl font-bold text-accent">{users}</p>
          <p className="text-muted">Usuários</p>
        </Card>
        <Card>
          <p className="text-3xl font-bold text-accent">{teams}</p>
          <p className="text-muted">Seleções sincronizadas</p>
        </Card>
        <Card>
          <p className="text-3xl font-bold text-accent">{championships}</p>
          <p className="text-muted">Copas</p>
        </Card>
      </div>

      <div className="mb-6">
        <SyncTeamsButton action={syncTeamsAction} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/users">
          <Card className="transition hover:border-accent/40">
            <h2 className="font-semibold">Gerenciar Usuários</h2>
            <p className="mt-1 text-sm text-muted">
              Cadastrar participantes e admins
            </p>
          </Card>
        </Link>
        <Link href="/admin/championships">
          <Card className="transition hover:border-accent/40">
            <h2 className="font-semibold">Gerenciar Copas</h2>
            <p className="mt-1 text-sm text-muted">
              Criar copas, sortear times e lançar resultados
            </p>
          </Card>
        </Link>
      </div>
    </PageEntrance>
  );
}
