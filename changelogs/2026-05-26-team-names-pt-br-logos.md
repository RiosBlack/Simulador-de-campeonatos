# Nomes em PT-BR e correção de logos (Argélia, Chile, Panamá)

## O que mudou

- Nomes das seleções passam a ser gravados em português brasileiro no sync (`team-names-pt-br.ts` + `localizeApiFootballTeam`).
- Corrigidos IDs no supplement que apontavam para clubes:
  - Argélia: `483` → `1532`
  - Chile: `837` → `2383`
  - Panamá: `2346` → `11`
- `remapIncorrectTeamIds()` migra referências em copas/jogos existentes e remove times órfãos após novo sync.

## Como aplicar

Admin → **Sincronizar seleções (API-Football)** para atualizar catálogo e migrar referências antigas.
