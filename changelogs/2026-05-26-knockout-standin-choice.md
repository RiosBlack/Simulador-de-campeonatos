# 2026-05-26 — Escolha do dono e stand-in no mata-mata

## Mudanças

- Confronto com `home.owner === away.owner` fica **pendente** até o dono escolher qual seleção segue.
- Campos em `Match`: `ownerConflictUserId`, `ownerContinuesTeamId`.
- Após a escolha, sorteio automático de stand-in entre os outros participantes **apenas no outro time**.
- UI no mata-mata: aviso para o dono (`KnockoutConflictResolver`) e banner para demais usuários (`KnockoutConflictWaiting`).
- Chave exibe "Aguardando escolha" enquanto pendente.
- Admin não pode registrar resultado até a resolução (`assertMatchReadyForResult`).

## Arquivos principais

- `prisma/schema.prisma` — campos de conflito no `Match`
- `src/_services/knockout.service.ts` — pendência, `resolveKnockoutOwnerConflict`, bloqueio
- `src/_actions/knockout.actions.ts` — action do participante
- `src/_components/championship/KnockoutConflictResolver.tsx`
- `src/app/(app)/championships/[id]/knockout/page.tsx`
- `src/app/(admin)/admin/championships/[id]/matches/page.tsx`
