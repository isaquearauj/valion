# AGENTS.md

## 1. Como trabalhar no Valion

Valion é um app de finanças pessoais em pt-BR, construído com Next.js 16, React 19, TypeScript,
Tailwind CSS v4 e Supabase Auth/Postgres/RLS. Produção: `https://valionapp.com`.

Este arquivo é um mapa operacional, não a documentação completa. Siga estas orientações com bom
senso: adapte o processo ao risco e ao tamanho da mudança, sem criar burocracia para tarefas triviais.

- Entenda o problema antes de escolher a solução. Luis e Isaque são fontes essenciais de contexto de
  produto; o agente contribui com investigação, ideação, design e execução.
- Comece pela menor solução correta. Depois de comprová-la, refatore quando isso melhorar clareza,
  eficiência, segurança ou manutenção.
- Preserve trabalho local alheio e não amplie o escopo sem necessidade.
- Use o mapa documental abaixo antes de redescobrir o repositório inteiro.
- Segurança, privacidade e integridade financeira fazem parte do comportamento, não são acabamento.

## 2. Workflow orientado por spec

Use SDD para mudanças relevantes ou ambíguas. Para correções óbvias, documentação e ajustes pequenos,
um objetivo e uma Definition of Done curtos são suficientes.

1. Descubra o problema, pessoas afetadas, evidências, restrições e resultado desejado.
2. Inspecione o comportamento, a arquitetura e os testes existentes.
3. Registre uma spec de trabalho local quando ela reduzir ambiguidade.
4. Confirme decisões de produto que alterem escopo, dados ou UX com Luis/Isaque.
5. Implemente em cortes verificáveis, mantendo o escopo explícito.
6. Valide proporcionalmente ao risco e entregue fatos, limitações e pendências.

Uma spec útil explicita, no mínimo:

- problema, objetivo, não objetivos e requisitos;
- alternativas e decisões relevantes;
- modelo de dados envolvido — entidades/tabelas, campos, relações, constraints, ownership/RLS,
  migration/backfill e impactos em tipos; escreva “não se aplica” quando realmente não houver dados;
- riscos, casos de borda, plano incremental e Definition of Done verificável;
- estratégia de testes e QA.

Specs de trabalho são artefatos locais: não podem ser versionadas nem publicadas no PR. Não há local
obrigatório para criá-las. O template reutilizável fica em `.agents/templates/spec.md`; o PR sintetiza
somente o contexto necessário para revisão.

## 3. Mapa de documentação

Leia apenas o que se aplica à tarefa:

| Assunto | Fonte de verdade |
| --- | --- |
| Setup, scripts e visão geral | `README.md` |
| Fronteiras e fluxo de dados | `docs/architecture.md` |
| Workflow, qualidade e ambientes | `docs/engineering.md` |
| Estratégia e comandos de teste | `docs/testing.md` |
| Segurança e privacidade | `docs/security.md` |
| Supabase local e produção | `docs/supabase-setup.md` |
| Snapshots e histórico | `docs/history.md` |
| Decisões arquiteturais | `docs/decisions/` |
| Regras de uma feature | `features/*/README.md` |
| Agents, skills e evals | `.agents/README.md` |

Atualize a fonte durável correspondente quando uma mudança alterar arquitetura, operação ou
invariantes. ADRs registram decisões amplas; não substituem specs de entrega.

## 4. Estrutura e arquitetura

Árvore curada — confirme detalhes no diretório e nos documentos da área:

```text
valion/
├── app/
│   ├── (app)/                    # Rotas autenticadas do App Router
│   ├── api/                      # Route Handlers
│   └── auth/                     # Callback do Supabase
├── components/ui/                # Primitives shadcn compartilhadas
├── features/
│   ├── auth/                     # Sessão, perfil, avatar e UI de conta
│   ├── finance/
│   │   ├── data/repositories/    # Queries e mutações Supabase tipadas
│   │   ├── domain/               # Tipos e regras financeiras puras
│   │   ├── forms/                # Schemas Zod
│   │   ├── hooks/                # Estado e concorrência
│   │   ├── providers/            # Contrato compartilhado das rotas
│   │   ├── presentation/         # View models
│   │   └── ui/                   # Rotas, dialogs, shell e componentes
│   └── navigation/               # Fonte de verdade das rotas principais
├── lib/supabase/                 # Clientes browser/server/admin e tipos gerados
├── supabase/
│   ├── migrations/               # Histórico imutável de migrations
│   └── schema.sql                # Referência consolidada do schema
├── tests/                        # Integrações transversais
├── docs/                         # Documentação durável e ADRs
├── .agents/                      # Skills, agents, templates e evals
├── .codex/agents/                # Agents Codex em TOML
└── scripts/                      # Automação e guards locais
```

Invariantes principais:

- `app/(app)/layout.tsx` protege a sessão e mantém provider/shell compartilhados; cada rota renderiza
  sua própria seção.
- `features/navigation/routes.ts` é a fonte de verdade dos paths principais.
- UI e providers não montam payloads SQL; repositórios tipados isolam persistência.
- Regras financeiras puras ficam em `domain`; validação de entrada fica em schemas Zod.
- Clientes Supabase são separados por ambiente em `lib/supabase` e usam `Database` gerado.
- Ao mudar um contrato persistido, atualize apenas as camadas realmente afetadas: migration/schema,
  tipos, validação, mapper/repositório, estado, UI e testes.
- Prefira módulos por responsabilidade. Aproximadamente 300 linhas é um alerta para revisar coesão,
  não um limite automático nem motivo para fragmentar código claro.

## 5. Setup, stack e comandos

- Use `pnpm`; `package.json` fixa `pnpm@10.28.0`.
- Use `nvm use`; `.nvmrc` fixa Node `22.22.3`.
- Imports internos usam `@/*` para a raiz.
- O ambiente comum é WSL Debian, mas scripts não devem depender de configuração pessoal da distro.
- `.env.local` usa `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e, quando necessário,
  `SUPABASE_SERVICE_ROLE_KEY` exclusivamente server-side.

| Objetivo | Comando |
| --- | --- |
| Instalar | `pnpm install --frozen-lockfile` |
| App local | `pnpm dev` |
| App + Supabase local | `pnpm dev:all` |
| Formato/lint Biome | `pnpm check` / `pnpm check:write` |
| ESLint Next/React | `pnpm lint:eslint` |
| TypeScript | `pnpm typecheck` |
| Testes / coverage | `pnpm test` / `pnpm test:coverage` |
| Gate sem banco | `pnpm verify` |
| Reset e integração Supabase | `pnpm verify:supabase` |
| Agents e skills | `pnpm verify:agents` |

Use Supabase CLI + Docker somente no ambiente local confirmado. Após um `push` na `main`, produção
recebe migrations pelo workflow `.github/workflows/supabase-migrations.yml` somente se o CI do SHA
terminar com sucesso; nunca use `supabase db push` diretamente contra produção. Consulte
`docs/supabase-setup.md` antes de operar banco.

## 6. Código, produto e segurança

- TypeScript é `strict`; prefira contratos explícitos, `import type` e evite `any`/casts para esconder
  inconsistências.
- Biome é a fonte de verdade para formato, imports e lint geral; ESLint cobre regras específicas de
  Next.js e React Hooks.
- Client Components declaram `"use client"`; código server-side usa o cliente Supabase de servidor.
- Produto, validações, toasts e mensagens de erro permanecem em pt-BR.
- Reuse tokens de `app/globals.css` e primitives de `components/ui`; preserve responsividade,
  acessibilidade, loading, erro, retry e pending onde forem relevantes.
- Valide entradas na fronteira. Não duplique a mesma regra em UI, estado e persistência sem motivo.
- Migrations aplicadas são imutáveis; correções usam nova migration. Mantenha `schema.sql` e tipos
  gerados coerentes.
- Preserve RLS e filtros explícitos por `user_id`; derive identidade da sessão, nunca de um identificador
  livre enviado pelo cliente.
- `SUPABASE_SERVICE_ROLE_KEY` nunca entra em Client Components, logs ou respostas.
- Não registre dados financeiros, tokens, emails completos, cookies ou payloads pessoais.
- Em auth/rotas server-side, considere CSRF/origin, open redirect, session confusion e mensagens que
  revelem existência ou detalhes internos.

## 7. Testes e QA

Use Vitest como stack padrão. Funcionalidades e bugs alterados precisam de testes focados; regras
financeiras, schemas, mappers, repositórios, auth e RLS merecem prioridade.

| Risco da mudança | Validação mínima esperada |
| --- | --- |
| Docs/config simples | `pnpm check` + `git diff --check` |
| UI/client | acima + ESLint + typecheck + testes focados |
| Funcionalidade/refatoração | `pnpm verify` + coverage quando relevante |
| Banco/auth/RLS | acima + `pnpm verify:supabase` |
| Agents/skills | `pnpm verify:agents` + evals relevantes |

QA com `agent-browser` é altamente recomendado para mudanças observáveis em rotas, formulários,
CRUD, auth, responsividade, tema ou teclado. Use a skill `valion-browser-qa`; evidências ficam em
`.context/` e nunca são versionadas. Exclusão de conta exige confirmação explícita imediatamente
antes da ação, inclusive no Supabase local.

Relate separadamente o que passou, falhou ou ficou bloqueado pelo ambiente. Não transforme teste não
executado em sucesso presumido.

## 8. Git, documentação e agentes

- Revise `git status` antes e depois; não reverta mudanças alheias nem inclua segredos/artefatos.
- Crie branch e commit quando solicitado. Push, PR, deploy e mutações externas exigem autorização
  explícita.
- Commits seguem Conventional Commits. PRs normais usam `main` como base.
- Quando o usuário pedir PR, use a skill `create-pr`; ela revisa `main...HEAD`, evita duplicação e
  registra DoD, QA, validações e riscos sem publicar specs/evidências locais.
- `CLAUDE.md` aponta para este arquivo. Skills compartilhadas ficam em `.agents/skills`; agents Claude
  em `.agents/agents`; agents Codex em `.codex/agents`.
- Use `valion-finance-feature` para cortes financeiros e `valion-supabase` para schema, RLS, Auth,
  Storage, tipos gerados ou deploy de banco.
- Delegue somente trabalho independente. A sessão principal continua responsável por integração,
  segurança e validação final.

Antes de entregar, confirme:

- escopo e Definition of Done atendidos ou pendências explícitas;
- testes proporcionais executados no estado final;
- documentação durável atualizada quando necessário;
- specs e evidências locais fora do Git;
- `git diff --check` e `git status` revisados.
