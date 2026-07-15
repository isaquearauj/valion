# Testes

## Supabase local

Use Docker e a CLI local para validar migrations:

```bash
supabase start
supabase status
supabase db reset --local
pnpm test:supabase
```

O seed demonstrativo, quando usado, é restrito ao ambiente local. Não há seed
em produção.

## Aplicação

```bash
pnpm test:integration
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm quality
git diff --check
```

Execute somente scripts existentes no `package.json`; neste projeto o teste
Supabase configurado é `pnpm test:supabase`, e `pnpm test:integration` pode não
estar disponível.

Inspeção remota autorizada pode usar `supabase db diff --linked`, que não
aplica alterações. A aplicação em produção ocorre somente pelo workflow
manual protegido e aprovado no environment `production`.
