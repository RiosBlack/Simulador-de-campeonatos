# Tabela dos melhores 3º colocados

## Alterações

- `getThirdPlaceStandings` em `standings.service.ts` — ranking dos 3º colocados com a mesma regra de desempate e corte do mata-mata
- `ThirdPlaceTable.tsx` — tabela abaixo dos grupos com destaque verde para os classificados
- `StandingsTableScroll.tsx` — wrapper com scroll horizontal interno nas tabelas
- Página `/championships/[id]/groups` — legenda separada para 1º/2º (accent) e melhores 3ºs (verde)
- Ajustes mobile: colunas em percentual, tipografia compacta, padding reduzido nos cards e scroll lateral quando necessário
- Layout mobile: padding da página em `p-1` (1x) no app layout
