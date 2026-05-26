import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/_lib/session";
import { getChampionshipForView } from "@/_services/championship.service";
import { Card } from "@/_components/ui/Card";
import { Badge } from "@/_components/ui/Badge";
import { PageEntrance } from "@/_components/anim/PageEntrance";

type Props = { params: Promise<{ id: string }> };

export default async function ChampionshipPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const championship = await getChampionshipForView(id, session?.user.id);

  if (!championship) notFound();

  const playedCount = championship.matches.filter((m) => m.played).length;

  return (
    <PageEntrance>
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted hover:text-accent">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">
          {championship.name}
        </h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{championship.status}</Badge>
          <Badge variant="muted">{championship.selectionMode}</Badge>
          <Badge variant="muted">Temporada {championship.season}</Badge>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-2xl font-bold text-accent">
            {championship.participants.length}
          </p>
          <p className="text-sm text-muted">Participantes</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-accent">
            {championship.groups.length}
          </p>
          <p className="text-sm text-muted">Grupos</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-accent">
            {playedCount}/{championship.matches.length}
          </p>
          <p className="text-sm text-muted">Jogos disputados</p>
        </Card>
      </div>

      <nav className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: `/championships/${id}/groups`, label: "Grupos", icon: "📋" },
          {
            href: `/championships/${id}/knockout`,
            label: "Mata-mata",
            icon: "🏆",
          },
          { href: `/championships/${id}/stats`, label: "Estatísticas", icon: "📊" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="flex flex-col items-center py-6 transition hover:border-accent/40">
              <span className="text-2xl">{item.icon}</span>
              <span className="mt-2 font-medium">{item.label}</span>
            </Card>
          </Link>
        ))}
      </nav>
    </PageEntrance>
  );
}
