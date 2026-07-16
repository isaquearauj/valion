# Engenharia

## Fluxo de desenvolvimento

Mudanças relevantes seguem Spec Driven Development: descoberta do problema com
Luis/Isaque, spec local com Definition of Done, implementação incremental e
validação proporcional ao risco. Specs de trabalho não possuem diretório
obrigatório, não são versionadas e nunca devem ser anexadas ao PR. O template
versionado é `.agents/templates/spec.md`; decisões arquiteturais duráveis ficam
em `docs/decisions/`.

Toda spec explicita o modelo de dados envolvido: entidades/tabelas, campos,
relações, constraints, ownership/RLS, migration/backfill e impacto nos contratos.
Quando não houver dados envolvidos, a spec registra “não se aplica” e a razão.

Comece pela menor implementação correta. Depois que o comportamento estiver
comprovado, refatore para reduzir acoplamento, melhorar eficiência,
manutenibilidade e segurança. O fluxo completo pode ser reduzido para tarefas
realmente triviais, desde que o resultado esperado continue explícito.

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
mantido apenas como camada complementar para `core-web-vitals` e React Hooks.
O preset TypeScript do ESLint é redundante com Biome + `tsc` e não é carregado.
O comando usa cache em `node_modules/.cache/eslint` e limita a análise aos
fontes da aplicação.

```bash
pnpm check
pnpm lint:eslint
pnpm typecheck
pnpm test
pnpm verify:agents
pnpm build
```

O guard lê `.nvmrc`, exige a mesma major/minor e alerta quando o patch hospedado diverge da versão local preferida `22.22.3`.
O CI mantém OSV Scanner. `pnpm audit` não faz parte do gate porque o endpoint do
registry não é confiável neste ambiente e duplicaria a auditoria independente.

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

## Agents, skills e QA de navegador

`AGENTS.md` é a fonte de verdade do workflow e `CLAUDE.md` aponta para ele. As
skills compartilhadas ficam em `.agents/skills`; agentes Claude ficam em
`.agents/agents` e seus equivalentes Codex em `.codex/agents`.
`pnpm verify:agents` valida essa paridade, os contratos mínimos das skills e a
proteção das pastas locais.

Mudanças de fluxo visual devem, sempre que possível, passar pela skill
`valion-browser-qa`. Relatórios e screenshots ficam em `.context/qa-<slug>/`,
organizados por execução e nunca versionados. Exclusão de conta exige
confirmação humana imediatamente antes da ação, inclusive no ambiente local.

Quando o usuário autorizar push e abertura de PR, use a skill `create-pr`. O PR
é aberto contra `main`, descreve problema, solução, Definition of Done,
validações e riscos, mas não publica specs ou evidências locais.
