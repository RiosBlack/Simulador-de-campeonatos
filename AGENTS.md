# Campeonato Resenha — AGENTS.md

## Resumo do Projeto

Simulador da Copa do Mundo 2026 onde cada participante recebe seleções (1 por grupo), o admin lança resultados e o sistema atualiza tabelas e mata-mata automaticamente, incluindo regras FIFA de desempate e sorteio quando um usuário enfrentaria a si mesmo.

## Tech Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 16 (App Router, Server Actions, RSC) |
| Linguagem | TypeScript |
| Package Manager | **pnpm** (obrigatório) |
| ORM / DB | Prisma 7 + Neon Postgres (`@prisma/adapter-pg`) |
| Auth | Better Auth (email/senha, admin cadastra usuários) |
| UI | Tailwind CSS v4, GSAP, Recharts, Zustand |
| API externa | API-Football v3 (`league=1`, `season=2026`) |
| Validação | Zod |

## Regras de Negócio

1. **1 time por grupo por usuário** — constraint DB + validação em `team-assignment.service.ts`
2. **Modos de atribuição**: `DRAW` (sorteio) ou `MANUAL` (admin escolhe)
3. **Mata-mata**: se `home.owner === away.owner`, o dono escolhe qual seleção segue; stand-in sorteado automaticamente no outro time entre os demais participantes
4. **Classificação**: 12×1º + 12×2º + 8 melhores 3ºs
5. **Desempate**: pontos → saldo → gols pró → confronto direto → fair play → sorteio
6. **Fair Play**: amarelo -1, 2º amarelo -3, vermelho direto -4, amarelo+vermelho -5

## Autenticação

- Signup público desabilitado; admin cria usuário com **nome + função** via `createUserAction` e recebe link de convite
- Convite: `/cadastro/[token]` — usuário define e-mail e senha; link válido **24h** ou até o primeiro uso
- Admin pode gerar novo link em `/admin/users` (`regenerateCredentialLinkAction`) para cadastro inicial ou troca de credenciais
- Roles: `ADMIN` | `MEMBER`
- `/` — home pública (lista copas; visitante abre campeonato e vê jogos/tabelas)
- `/login` — entrada; `/cadastro/*` — setup de credenciais (público); `/profile` e `/admin/*` exigem sessão
- Rotas `/admin/*` protegidas por `requireAdmin()` no layout
- Sessão: Better Auth cookie `better-auth.session_token`

## Estrutura de Pastas

```
src/
  app/           # rotas Next.js
  _lib/          # prisma, auth, api-football, session, rbac
  _services/     # regras de negócio
  _actions/      # Server Actions
  _components/   # UI
  _stores/       # Zustand
  _utils/        # helpers
  generated/prisma/  # Prisma Client (gerado)
prisma/
  schema.prisma
  seed.ts
```

## ERD (simplificado)

```
User ──< ChampionshipParticipant >── Championship
User ──< ChampionshipTeam (owner) >── Group ── Championship
Team ──< ChampionshipTeam
Championship ──< Match ──< MatchEvent
```

## Variáveis de Ambiente

Ver [.env.example](.env.example).

## Comandos

```bash
pnpm install
pnpm db:generate
pnpm db:migrate    # ou db:push
pnpm db:seed
pnpm dev
```

## Changelog

- [2026-06-05-favicon-copa-do-mundo](changelogs/2026-06-05-favicon-copa-do-mundo.md) — favicon com troféu da Copa do Mundo
- [2026-05-26-user-credential-invite](changelogs/2026-05-26-user-credential-invite.md) — convite por link para e-mail/senha; admin só nome + função
- [2026-05-26-hydration-html-suppress](changelogs/2026-05-26-hydration-html-suppress.md) — `suppressHydrationWarning` no layout raiz (extensões do navegador)
- [2026-05-26-world-cup-2026-official-teams](changelogs/2026-05-26-world-cup-2026-official-teams.md) — catálogo fixo com as 48 seleções oficiais da Copa 2026
- [2026-05-26-team-names-pt-br-logos](changelogs/2026-05-26-team-names-pt-br-logos.md) — nomes das seleções em PT-BR; logos corrigidos (Argélia, Chile, Panamá)
- [2026-05-26-knockout-standin-choice](changelogs/2026-05-26-knockout-standin-choice.md) — dono escolhe seleção no conflito; stand-in no outro time
- [2026-05-26-championship-group-selection](changelogs/2026-05-26-championship-group-selection.md) — admin monta grupos e seleções ao criar copa
- [2026-05-26-public-home](changelogs/2026-05-26-public-home.md) — home pública e login em `/login`
- [2026-05-25-bootstrap](changelogs/2026-05-25-bootstrap.md) — implementação inicial
