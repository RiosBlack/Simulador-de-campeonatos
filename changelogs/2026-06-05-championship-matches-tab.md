# Aba de Jogos no Campeonato

## O que mudou

- Nova rota pública `/championships/[id]/matches` com seções **Próximos jogos** e **Resultados**.
- Card **Jogos** no hub da copa (ao lado de Grupos, Mata-mata e Estatísticas).
- Componente `MatchList` para agrupar jogos por grupo e fase do mata-mata.
- `MatchCard` reutilizado com badge "Em breve", rodada (`R{n}`), placar de pênaltis e nome do participante abaixo da seleção.

## Arquivos

- `src/app/(app)/championships/[id]/matches/page.tsx`
- `src/app/(app)/championships/[id]/page.tsx`
- `src/_components/championship/MatchList.tsx`
- `src/_components/championship/MatchCard.tsx`
