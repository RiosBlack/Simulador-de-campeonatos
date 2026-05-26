# Changelog: Bootstrap — 2026-05-25

## Escopo

Implementação inicial do simulador Copa do Mundo 2026 conforme plano aprovado.

## Alterações

- Bootstrap Next.js 16 + pnpm + Tailwind v4 + tema dark verde neon
- Schema Prisma completo (User, Team, Championship, Group, Match, etc.)
- Better Auth com roles ADMIN/MEMBER
- Integração API-Football (sync 48 seleções)
- Services: standings, fairplay, team-assignment, knockout, championship
- Páginas usuário: dashboard, grupos, mata-mata, stats, perfil
- Páginas admin: usuários, copas, sorteio/manual, lançamento de resultados
- GSAP (PageEntrance, BracketTree) + Recharts (gols, evolução)
- Headers de segurança em `next.config.ts`
- Upload de foto de perfil com validação MIME/tamanho

## Pendências / Próximos passos

- Conectar `DATABASE_URL` Neon em produção
- Rodar `pnpm db:migrate` e `pnpm db:seed` no ambiente do usuário
- Ajustar cookie de sessão no middleware se necessário após teste real
