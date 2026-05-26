# 2026-05-26 — Seleção manual de grupos na criação da copa

## Mudanças

- Wizard de nova copa ganhou passo **Grupos e seleções** (4 passos no total).
- Admin escolhe formato **32** (8 grupos) ou **48** (12 grupos) e atribui 4 seleções por grupo.
- Removido sorteio automático de seleções na criação (primeiras N por nome + `shuffle`).
- Validação Zod e server action garantem grupos completos, letras válidas e IDs únicos no catálogo.
- Utilitários em `src/_utils/championship-groups.ts` para letras, slots e validação no client.

## Atribuição manual no wizard

- No passo 4, ao escolher **Escolha manual**, a tabela de grupos/seleções/participantes aparece logo abaixo.
- Botão **Criar copa** só habilita quando todas as seleções tiverem dono (regra 1 por grupo).
- Atribuições são salvas na criação via `assignOwnersBulk`.

## Sync 48 seleções

- `fetchWorldCupTeams` escolhe a temporada com **mais** times (não para na primeira com 32).
- Se a API retornar só 32 (ex.: plano free + Copa 2022), completa até 48 com lista nacional em `src/_data/world-cup-2026-supplement.ts`.
- Plano pago com `season=2026` continua usando os 48 times oficiais da API quando disponíveis.
- Painel admin exibe aviso quando a lista foi complementada.
- Sync grava times em lotes (`upsertTeamsCatalog`) para evitar timeout P2028 da transação Prisma (5s).
- Sorteio e atribuição em massa (`runDrawAssignment`, `assignOwnersBulk`) usam updates em lotes, sem transação única de 5s.
- Lançar resultados: seções **Registrar** e **Atualizar**; actions `registerMatchResultAction` e `updateMatchResultAction`.
- Criação da copa gera 6 jogos por grupo (turno único) na mesma transação de grupos/times.
- `ensureGroupStageMatches` recria jogos de grupos em copas antigas ao abrir `/admin/.../matches`.
- Tela de jogos agrupa por letra do grupo; atualização preserva cartões já lançados.
- Tabelas da fase de grupos destacam em verde as seleções classificadas no momento (1º/2º + melhores 3ºs).
- Chave do mata-mata exibe o nome do participante (dono da seleção ou stand-in em verde).

## Correções (404)

- `/admin/championships/[id]` redireciona para `/admin/championships/[id]/teams` (rota índice inexistente gerava 404).
- Criador da copa pode visualizar campeonato em `SETUP` em `/championships/[id]`.
- Erros ao criar copa retornam mensagem na UI em vez de falha silenciosa.

## Arquivos principais

- `src/app/(admin)/admin/championships/new/page.tsx` — carrega catálogo `Team`
- `src/_components/admin/GroupBuilderStep.tsx` — UI de montagem dos grupos
- `src/_components/admin/CreateChampionshipForm.tsx` — wizard com 4 passos
- `src/_actions/admin.actions.ts` — `groupAssignments` no `createChampionshipAction`
- `src/_services/team-assignment.service.ts` — `initializeChampionshipStructure` com assignments explícitos
