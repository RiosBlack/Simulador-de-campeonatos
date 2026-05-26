# 2026-05-26 — Convite de credenciais para usuários

## Mudanças

- Admin cria usuário apenas com **nome** e **função** (`ADMIN` / `MEMBER`).
- Sistema gera link `/cadastro/[token]` válido por **24 horas** ou até o primeiro cadastro de e-mail e senha.
- Página pública de cadastro: e-mail, senha e confirmação; após salvar, login automático.
- Em `/admin/users`, botão **Gerar link de acesso** / **Novo link de acesso** para reenviar convite (troca de e-mail/senha).
- Usuários com cadastro pendente exibem badge **Pendente** e não mostram e-mail placeholder.
- Modelo `UserCredentialToken` + campo `User.credentialSetupComplete`.
- Serviço `user-credential-token.service.ts` (token SHA-256, revogação de links ativos).

## Regras

- Um link ativo por usuário; gerar novo revoga os anteriores não usados.
- Token invalidado ao concluir o cadastro (`usedAt`).
- Usuários existentes marcados com `credentialSetupComplete = true` na migração.

## Arquivos principais

- `prisma/schema.prisma` — `UserCredentialToken`, `credentialSetupComplete`
- `src/_services/user-credential-token.service.ts`
- `src/_actions/admin.actions.ts` — `createUserAction`, `regenerateCredentialLinkAction`, `completeAccountSetupAction`
- `src/app/(auth)/cadastro/[token]/page.tsx`
- `src/_components/auth/SetupAccountForm.tsx`
- `src/_components/admin/CreateUserForm.tsx`, `RegenerateCredentialLinkButton.tsx`
- `src/middleware.ts` — `/cadastro` público
