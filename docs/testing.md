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

`pnpm test:coverage` bloqueia regressões abaixo de 73% em statements/lines,
59% em branches e 67% em functions. Esses valores são piso: módulos novos ou
refatorados recebem testes focados e os thresholds nunca são reduzidos.

## QA de navegador

Mudanças com comportamento observável em rotas, formulários, Auth, perfil,
navegação ou responsividade devem considerar a skill `valion-browser-qa`. O QA
usa `agent-browser` e grava relatório/screenshots em `.context/qa-<slug>/`.
`.context` é local e nunca deve ser versionado.

Exclusão de conta exige confirmação explícita imediatamente antes da ação,
mesmo usando usuário demo e Supabase local. Ajustes sem efeito visual podem
dispensar browser QA com justificativa proporcional ao risco.

Inspeção remota autorizada pode usar `supabase db diff --linked`, que não
aplica alterações. A aplicação em produção ocorre somente pelo workflow
manual protegido e aprovado no environment `production`.
