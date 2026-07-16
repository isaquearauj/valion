# Auth e perfil

Este módulo transforma a sessão Supabase em `AppUser` e concentra autenticação, perfil, avatar
privado e lifecycle da conta.

## Responsabilidades

- carregar e normalizar o usuário autenticado;
- prover sessão para a shell autenticada;
- autenticação, cadastro, recuperação e alteração de senha;
- atualizar nome e avatar;
- migrar avatar base64 legado;
- iniciar a exclusão segura da conta.

## Fluxo

```text
Server layout
  → getCurrentAppUser()
  → AuthSessionProvider
  → AccountDialog / shell
  → profile-repository
  → Supabase profiles + Storage privado
```

`DELETE /api/account` é server-side: valida origem e sessão, limpa os objetos privados e somente
depois exclui o usuário Auth com o cliente admin.

## Invariantes

- `SUPABASE_SERVICE_ROLE_KEY` nunca entra no cliente.
- O banco persiste `avatar_path`, não URL assinada nem base64 novo.
- Avatares aceitam apenas JPEG/PNG/WebP de até 2 MB.
- URL de exibição é assinada e temporária.
- Falha ao limpar Storage interrompe a exclusão de Auth.
- Erros ao cliente são genéricos e não expõem detalhes internos.

## Testes relevantes

- `features/auth/**/*.test.ts(x)` para sessão, perfil e migração;
- `app/api/account/route.test.ts` para origem, ordem e falhas;
- `pnpm verify:supabase` para RLS, Storage e cascade reais;
- QA com `valion-browser-qa` para perfil, avatar e fluxos de Auth.
