import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/_lib/session";
import { listChampionshipsForHome } from "@/_services/championship.service";
import { Card } from "@/_components/ui/Card";
import { Badge } from "@/_components/ui/Badge";
import { PageEntrance } from "@/_components/anim/PageEntrance";
import prisma from "@/_lib/prisma";

export default async function HomePage() {
  const session = await getSession();
  const userId = session?.user.id;
  const championships = await listChampionshipsForHome(userId);

  const myTeams = userId
    ? await prisma.championshipTeam.findMany({
        where: { ownerUserId: userId },
        include: { team: true, group: true, championship: true },
        take: 8,
      })
    : [];

  const upcomingMatches = userId
    ? await prisma.match.findMany({
        where: {
          played: false,
          championship: {
            participants: { some: { userId } },
          },
        },
        take: 5,
        orderBy: { scheduledAt: "asc" },
      })
    : [];

  const teamMap =
    upcomingMatches.length > 0
      ? await prisma.team.findMany({
          where: {
            id: {
              in: upcomingMatches.flatMap((m) => [m.homeTeamId, m.awayTeamId]),
            },
          },
        })
      : [];
  const teamById = Object.fromEntries(teamMap.map((t) => [t.id, t]));

  return (
    <PageEntrance>
      <header className="mb-8">
        {session?.user ? (
          <>
            <p className="text-sm text-muted">Boa noite,</p>
            <h1 className="text-2xl font-bold md:text-3xl">
              {session.user.name}
            </h1>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">Campeonato Resenha</p>
            <h1 className="text-2xl font-bold md:text-3xl">Copa do Mundo 2026</h1>
            <p className="mt-2 text-sm text-muted">
              Abra uma copa para ver jogos, tabelas e mata-mata.
            </p>
          </>
        )}
      </header>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Copas</h2>
        {championships.length === 0 ? (
          <Card>
            <p className="text-muted">
              Nenhuma copa disponível no momento. Volte em breve.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {championships.map((c) => (
              <Link key={c.id} href={`/championships/${c.id}`}>
                <Card className="transition hover:border-accent/40 hover:glow-ring">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold">{c.name}</h3>
                    <Badge variant="muted">{c.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {c._count.participants} participantes · {c._count.matches}{" "}
                    jogos
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {myTeams.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Minhas Seleções</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {myTeams.map((ct) => (
              <Card key={ct.id} className="flex flex-col items-center p-3">
                <Image
                  src={ct.team.logoUrl}
                  alt={ct.team.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                  unoptimized
                />
                <p className="mt-2 text-center text-xs font-medium">
                  {ct.team.name}
                </p>
                <p className="text-[10px] text-accent">Grupo {ct.group.letter}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {upcomingMatches.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Próximos Jogos</h2>
          <div className="space-y-3">
            {upcomingMatches.map((m) => {
              const home = teamById[m.homeTeamId];
              const away = teamById[m.awayTeamId];
              if (!home || !away) return null;
              return (
                <Card key={m.id} className="flex items-center justify-between">
                  <span className="text-sm">
                    {home.name} vs {away.name}
                  </span>
                  <Badge variant="live">Em breve</Badge>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </PageEntrance>
  );
}
