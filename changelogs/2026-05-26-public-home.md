# 2026-05-26 — Home pública e login em /login

## Mudanças

- `/` passa a ser a página inicial com listagem de copas (conteúdo antes em `/dashboard`).
- `/login` permanece como rota de autenticação; callback pós-login redireciona para `/`.
- `/dashboard` redireciona para `/` (compatibilidade).
- Campeonatos em status diferente de `SETUP` são visíveis sem login (jogos, grupos, mata-mata, stats).
- Middleware protege apenas `/profile` e `/admin`; demais rotas de leitura são públicas.
- Novos helpers em `championship.service.ts`: `listPublicChampionships`, `getPublicChampionship`, `getChampionshipForView`, `listChampionshipsForHome`.

## Arquivos principais

- `src/app/(app)/page.tsx` — home
- `src/middleware.ts` — rotas públicas vs protegidas
- `src/_services/championship.service.ts` — acesso público
- `src/_components/layout/*` — navegação apontando para `/`
