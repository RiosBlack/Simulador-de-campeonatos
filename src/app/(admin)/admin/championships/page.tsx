import Link from "next/link";
import { requireAdmin } from "@/_lib/session";
import prisma from "@/_lib/prisma";
import { Card } from "@/_components/ui/Card";
import { Badge } from "@/_components/ui/Badge";
import { Button } from "@/_components/ui/Button";
import { PageEntrance } from "@/_components/anim/PageEntrance";

export default async function AdminChampionshipsPage() {
  await requireAdmin();
  const championships = await prisma.championship.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participants: true, matches: true } } },
  });

  return (
    <PageEntrance>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Copas</h1>
        <Link href="/admin/championships/new">
          <Button>Nova copa</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {championships.map((c) => (
          <Card key={c.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">{c.name}</h2>
                <p className="text-sm text-muted">
                  {c._count.participants} participantes · {c._count.matches}{" "}
                  jogos
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{c.status}</Badge>
                <Badge variant="muted">{c.selectionMode}</Badge>
                <Link href={`/admin/championships/${c.id}/teams`}>
                  <Button variant="secondary" size="sm">
                    Times
                  </Button>
                </Link>
                <Link href={`/admin/championships/${c.id}/matches`}>
                  <Button variant="secondary" size="sm">
                    Jogos
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageEntrance>
  );
}
