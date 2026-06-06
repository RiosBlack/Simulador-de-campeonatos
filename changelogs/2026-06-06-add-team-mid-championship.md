# 2026-06-06 — Adicionar seleção e jogador na gestão de times

## Mudanças

- Admin pode **completar copas incompletas** em `/admin/championships/[id]/teams` via painel "Adicionar seleção".
- Formulário: grupo (com vaga e sem jogos lançados), seleção do catálogo e jogador.
- Jogador novo é **inscrito automaticamente** na copa (`ChampionshipParticipant`).
- Cria apenas **jogos faltantes** do grupo (`createMissingGroupMatches`) — nunca altera partidas com `played: true`.
- Bloqueios: grupo com 4 seleções, copa no limite (32 ou 48), status `KNOCKOUT`/`FINISHED`, grupo com resultado lançado.
- Cards de grupo exibem `X/4 seleções` e badge "Jogos lançados" quando bloqueado.

## Arquivos principais

- `src/_services/team-assignment.service.ts` — `addTeamToChampionship`, `createMissingGroupMatches`
- `src/_actions/admin.actions.ts` — `addChampionshipTeamAction`
- `src/_components/admin/AddTeamPanel.tsx` — formulário admin
- `src/app/(admin)/admin/championships/[id]/teams/page.tsx` — integração e dados elegíveis
