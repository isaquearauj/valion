# Testes

## Supabase local

Use Docker e a CLI local para validar migrations:

```bash
pnpm supabase:start
pnpm verify:supabase
```

O seed demonstrativo, quando usado, é restrito ao ambiente local. Não há seed
em produção.

## Aplicação

```bash
pnpm verify
git diff --check
```

`pnpm verify` executa Biome, ESLint, typecheck, os testes Vitest e o build.
`pnpm verify:supabase` é separado porque exige Docker e os serviços locais.

Inspeção remota autorizada pode usar `supabase db diff --linked`, que não
aplica alterações. A aplicação em produção ocorre somente pelo workflow
manual protegido e aprovado no environment `production`.
