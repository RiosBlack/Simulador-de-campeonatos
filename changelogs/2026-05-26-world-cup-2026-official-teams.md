# Catálogo oficial: 48 seleções da Copa 2026

## O que mudou

- Sync passa a usar lista fixa em `world-cup-2026-teams.ts` (12 grupos × 4 seleções), alinhada ao sorteio oficial.
- Removido complemento da Copa 2022 (`world-cup-2026-supplement.ts`).
- Corrigido ID do Uzbequistão: `1568` (antes `1533`, que é Cabo Verde).
- Migração automática: referências antigas em `1533` (Uzbequistão) → `1568` antes de gravar Cabo Verde em `1533`.
- Nomes PT-BR atualizados para as 48 seleções em `team-names-pt-br.ts`.

## Como aplicar

Admin → **Sincronizar seleções (API-Football)** para atualizar o catálogo e migrar referências antigas.

## Correção (timeout P2028)

- `remapIncorrectTeamIds` passa a usar uma transação curta por par de IDs (evita estourar o limite de 5s do Prisma).
