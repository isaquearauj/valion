# Engenharia

## Fluxo de desenvolvimento

Mudanças relevantes seguem desenvolvimento orientado por requisitos claros: alinhamento do problema com Isaque (produto), escopo bem definido com Definition of Done verificável, implementação incremental e validação proporcional ao risco.

Toda especificação deve explicitar o modelo de dados envolvido:
- Entidades/tabelas, campos, relações, constraints e ownership/RLS;
- Migrations/backfills e impacto nos contratos de tipagem TypeScript;
- Quando não houver persistência envolvida, registre “não se aplica” e a razão.

Comece pela menor implementação correta. Depois que o comportamento estiver comprovado e testado, refatore para reduzir acoplamento, melhorar legibilidade, manutenibilidade e segurança.

## Migrations Supabase

As migrations são arquivos versionados em `supabase/migrations/`. Alterações de schema ou dados devem ser criadas como uma nova migration, preferindo SQL idempotente. Migrations já aplicadas são imutáveis; correções devem ser novas migrations.

O desenvolvimento usa Supabase local com Docker:

```bash
pnpm supabase:start
pnpm test:supabase
```

Para recriar o banco local do zero:

```bash
pnpm supabase:reset
```

O comando de reset usa explicitamente `--local` para evitar que qualquer projeto em nuvem seja afetado.

## Qualidade de código e gates

O Biome é a fonte de verdade para formatação, organização de imports e lint geral. O ESLint é mantido apenas como camada complementar para regras específicas de React Hooks e Next.js (`core-web-vitals`).

Comandos padrão de validação:

```bash
pnpm check          # Biome lint e formatação
pnpm check:write    # Aplicação de correções seguras do Biome
pnpm lint           # Biome + ESLint
pnpm typecheck      # Verificação estrita TypeScript (tsc)
pnpm test           # Testes unitários com Vitest
pnpm quality        # Suite completa (Biome + ESLint + Typecheck + Testes)
pnpm verify         # Quality gate completo + Build de produção
```

O projeto requer **Node >= 22** e gerenciador **pnpm**.

### Dependências e segurança

- O CI executa auditoria de dependências com OSV Scanner para mitigar vulnerabilidades conhecidas no `pnpm-lock.yaml`.
- Não aprove scripts de instalação arbitrários no pnpm sem revisar o pacote e a necessidade do script. Os pacotes `msw`, `sharp` e `unrs-resolver` estão declarados em `ignoredBuiltDependencies` no `package.json`.

## Deploy e migrations de produção

- **Vercel:** Aplicação Next.js hospedada com domínio principal `valionapp.com`.
- **Supabase Cloud:** Produção recebe migrations automaticamente pelo workflow `.github/workflows/supabase-migrations.yml` após a conclusão bem-sucedida do pipeline de CI para um `push` na branch `main`.
- O checkout usa o SHA exato validado no CI.
- O deploy utiliza o GitHub Environment `production`. **Nunca execute `supabase db push` diretamente contra o banco de produção.**

Para inspeção autorizada de um projeto remoto sem aplicar alterações:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db diff --linked
```

Use `supabase logout` ao terminar a sessão operacional.

## Padrões de Git e Pull Requests

- Branches devem ser descritivas (`feat/nome`, `fix/descricao`, `chore/ajuste`).
- Commits seguem o padrão Conventional Commits em português (`feat: ...`, `fix: ...`, `chore: ...`).
- PRs são abertos contra a branch `main`, descrevendo problema, solução adotada, Definition of Done atendida, validações realizadas e possíveis riscos.
