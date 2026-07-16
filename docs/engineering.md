# Engenharia

Pull requests também geram um preview da Vercel para validar a integração de deploy antes do merge.

## Migrations Supabase

As migrations são arquivos versionados em `supabase/migrations/`. Alterações
de schema ou dados devem ser criadas como uma nova migration, preferindo SQL
idempotente. Migrations já aplicadas não devem ser editadas; correções devem
ser novas migrations.

O desenvolvimento usa Supabase local com Docker:

```bash
pnpm supabase:start
pnpm verify:supabase
```

Seeds são somente locais e nunca fazem parte do deploy. O script de reset usa
explicitamente `--local` para evitar que um projeto vinculado seja recriado por
engano.

## Qualidade de código

O Biome é a fonte de verdade para formatação, imports e lint geral. O ESLint é
mantido como camada complementar para regras específicas do Next.js e React.

```bash
pnpm check
pnpm lint:eslint
pnpm typecheck
pnpm test
pnpm build
```

Use `pnpm check:write` para correções seguras. Não rode `--unsafe` em massa:
revise cada correção que puder alterar comportamento.

O job `dependency-audit` de `.github/workflows/ci.yml` examina o
`pnpm-lock.yaml` com OSV Scanner e bloqueia vulnerabilidades conhecidas. Não
aprove scripts de instalação ignorados pelo pnpm sem revisar o pacote e a
necessidade do script. Os scripts de `msw`, `sharp` e `unrs-resolver` são
ignorados explicitamente: o projeto não usa um service worker do MSW, e os
artefatos nativos publicados de Sharp/UNRS foram validados pelo build e lint.

Produção só recebe migrations pelo workflow manual
`.github/workflows/supabase-migrations.yml`, disparado em `workflow_dispatch`,
com o GitHub Environment `production`. Um agente autorizado pode disparar a
Action com `gh workflow run "Supabase migrations" --ref main`; não é necessário
que o desenvolvedor clique no GitHub. Não execute `supabase db push`
diretamente contra produção.

Para inspeção autorizada do remoto, use `supabase login`,
`supabase link --project-ref <project-ref>` e `supabase db diff --linked`. A
senha é interativa e não deve ser enviada pelo chat ou commitada. A CLI pode
guardar a sessão no armazenamento nativo da máquina; runners efêmeros devem
usar secrets ou secret manager. Use `supabase logout` ao terminar.
