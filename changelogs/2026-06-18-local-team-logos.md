# Logos das seleções hospedadas localmente

## O que mudou

- Logos passam a ser servidas de `/teams/{id}.png` (same-origin), em vez de `media.api-sports.io`.
- Novo utilitário `src/_utils/team-logo.ts` com URLs local/remota.
- Sync do catálogo (`syncWorldCupTeamsCatalog`) grava sempre `logoUrl` local.
- Script `pnpm logos:sync` baixa os PNGs da API-Football para `public/teams/` e atualiza o banco se `DATABASE_URL` estiver definida.

## Motivo

Navegadores com bloqueio de rastreadores (Opera, Brave) e alguns mobile bloqueavam imagens cross-origin do CDN externo.

## Como aplicar

```bash
pnpm logos:sync
```

Ou admin → **Sincronizar seleções** (atualiza `logoUrl` no banco; os arquivos em `public/teams/` vêm do deploy).
