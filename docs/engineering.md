# Engenharia

## Migrations Supabase

As migrations são arquivos versionados em `supabase/migrations/`. Alterações
de schema ou dados devem ser criadas como uma nova migration, preferindo SQL
idempotente. Migrations já aplicadas não devem ser editadas; correções devem
ser novas migrations.

O desenvolvimento usa Supabase local com Docker:

```bash
supabase start
supabase status
supabase db reset --local
pnpm test:integration
```

Neste repositório, o teste de integração equivalente disponível é
`pnpm test:supabase`; confirme os scripts em `package.json` antes de executar
comandos adicionais. Seeds são somente locais e nunca fazem parte do deploy.

Produção só recebe migrations pelo workflow manual
`.github/workflows/supabase-migrations.yml`, disparado em `workflow_dispatch`,
com o GitHub Environment `production` e seus required reviewers. Não execute
`supabase db push` diretamente contra produção.

Para inspeção autorizada do remoto, use `supabase login`,
`supabase link --project-ref <project-ref>` e `supabase db diff --linked`. A
senha é interativa e não deve ser enviada pelo chat ou commitada. A CLI pode
guardar a sessão no armazenamento nativo da máquina; runners efêmeros devem
usar secrets ou secret manager. Use `supabase logout` ao terminar.
