# Hydration — suppressHydrationWarning no layout raiz

## Problema

Aviso de hydration mismatch no `<html>` ao abrir rotas como `/admin/championships/new`, com atributos extras no cliente (ex.: `data-lt-installed` de extensões como LanguageTool).

## Solução

`suppressHydrationWarning` em `<html>` e `<body>` no `src/app/layout.tsx`, conforme documentação do React para diferenças inevitáveis entre SSR e DOM modificado por extensões do navegador.
