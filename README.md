# Campeonato Resenha

Simulador da Copa do Mundo 2026 com resenha entre amigos.

## Setup

1. Copie `.env.example` para `.env` e configure `DATABASE_URL` (Neon Postgres).
2. Instale dependências:

```bash
pnpm install
```

3. Migre e seed:

```bash
pnpm db:push
pnpm db:seed
```

4. Sincronize seleções (como admin após login) ou via API:

```bash
pnpm dev
```

Login padrão seed: `admin@copa.local` / senha em `ADMIN_PASSWORD` no `.env`.

> **API-Football:** o plano gratuito pode não expor `season=2026`. O sync tenta temporadas anteriores automaticamente; para as 48 seleções oficiais de 2026, use um plano com acesso à temporada.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Dev server |
| `pnpm build` | Build produção |
| `pnpm db:seed` | Cria admin inicial |
| `pnpm db:studio` | Prisma Studio |

Documentação para agentes: [AGENTS.md](AGENTS.md).
