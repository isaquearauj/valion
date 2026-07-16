# AGENTS.md

## Propósito

Este arquivo é o manual operacional dos agentes que trabalham no Valion. Ele descreve o
workflow de desenvolvimento, as fronteiras de arquitetura, os comandos oficiais e as regras de
segurança que devem permanecer verdadeiras em qualquer mudança.

O projeto segue Spec-Driven Development (SDD): mudanças relevantes começam pela compreensão do
problema e por uma spec local com Definition of Done. Luis e Isaque são fontes essenciais de
contexto de produto; o agente ajuda na investigação, ideação, design thinking, escrita da spec,
implementação e validação. Tarefas triviais e de baixo risco podem usar um fluxo reduzido.

`CLAUDE.md` é um symlink para este arquivo. Não crie uma segunda fonte de instruções.

## Índice

1. Visão rápida
2. Workflow SDD
3. Estrutura do projeto
4. Stack e arquitetura
5. Setup e ambientes
6. Comandos oficiais
7. Banco de dados e Supabase
8. Padrões de código
9. Frontend e experiência do usuário
10. Testes e QA
11. Segurança e privacidade
12. Git, commits e pull requests
13. Documentação
14. Agents e skills
15. Definition of Done

## 1. Visão rápida

- Valion é um app Next.js 16 + React 19 para controle financeiro pessoal em pt-BR.
- Supabase fornece Auth, Postgres, RLS e Storage privado.
- Produção está em `https://valionapp.com` com deploy Vercel.
- Use `pnpm`; `package.json` fixa `pnpm@10.28.0`.
- Use Node `22.22.3`, definido em `.nvmrc`.
- TypeScript é `strict` e imports internos usam o alias `@/*`.
- Biome é a fonte de verdade para formato, imports e lint geral.
- ESLint complementa o Biome com regras de Next.js e React Hooks.
- Vitest é a única stack de testes automatizados desta iniciativa.
- RLS e filtros explícitos por `user_id` protegem dados financeiros.
- Migrations de produção só são aplicadas pelo workflow protegido do GitHub Actions.
- Leia `README.md`, `docs/architecture.md` e o README da feature tocada antes de explorar o repo.

## 2. Workflow SDD

### 2.1 Quando usar o fluxo completo

Use SDD completo quando a tarefa envolver pelo menos um destes pontos:

- comportamento novo ou alteração de regra de produto;
- mudança financeira, persistência, Auth, RLS ou Storage;
- nova rota, seção, integração ou contrato público;
- refatoração que atravessa camadas;
- risco de regressão, dados pessoais ou decisão arquitetural;
- problema cuja causa ou resultado esperado ainda não está claro.

Uma correção óbvia de texto, ajuste isolado de estilo, rename mecânico ou manutenção equivalente
pode usar o fluxo reduzido: confirmar o resultado, alterar, executar gates proporcionais e entregar.

### 2.2 Descobrir antes de construir

1. Leia as instruções e documentos da área.
2. Inspecione o comportamento e os testes atuais antes de propor uma solução.
3. Separe fatos confirmados, hipóteses e decisões de produto.
4. Consulte Luis ou Isaque quando a resposta alterar produto, fórmula, taxonomia ou escopo.
5. Explique alternativas, impacto e recomendação sem transformar hipótese em requisito.
6. Identifique riscos de dados, segurança, acessibilidade, concorrência e migração.

### 2.3 Spec local

Specs de trabalho vivem em `docs/specs/`, são locais e não podem ser versionadas. Use o template
versionado em `.agents/templates/spec.md` e mantenha a spec atualizada durante a implementação.

Uma spec relevante contém:

- problema real e evidências;
- pessoas e fluxos afetados;
- objetivo e não objetivos;
- requisitos funcionais e de segurança;
- decisões e alternativas descartadas;
- impacto em arquitetura e dados;
- plano incremental;
- Definition of Done verificável;
- estratégia de testes e QA;
- perguntas ainda abertas.

O PR não publica a spec local. Ele registra o contexto necessário para revisão: problema, solução,
decisões, DoD atendido, validações executadas e pendências reais.

### 2.4 Implementar em cortes pequenos

1. Resolva primeiro o menor corte correto e seguro.
2. Prove o comportamento com teste ou reprodução.
3. Só então otimize e refatore onde isso melhorar clareza, eficiência ou manutenção.
4. Evite abstração antecipada, generalização hipotética e código sem consumidor.
5. Preserve trabalho local alheio e mantenha cada mudança dentro do escopo da spec.
6. Para mudanças grandes, prefira commits e PRs revisáveis, mas não crie commit sem pedido.

### 2.5 Validar e entregar

- Execute os gates proporcionais ao risco e registre exatamente o que rodou.
- Diferencie teste automatizado, QA em navegador e validação ainda pendente.
- Compare o resultado final com cada item do Definition of Done.
- Revise `git diff --check`, `git status` e a ausência de segredos/artefatos locais.
- Explique comportamento entregue, decisões importantes, riscos e próximos passos.

## 3. Estrutura do projeto

Tree curada das áreas que definem a arquitetura:

```text
valion/
├── app/                              # App Router, layouts, páginas e Route Handlers
│   ├── (app)/                        # Rotas autenticadas
│   │   ├── layout.tsx                # Auth + providers + shell compartilhada
│   │   ├── dashboard/page.tsx
│   │   ├── receitas/page.tsx
│   │   ├── despesas/page.tsx
│   │   ├── investimentos/page.tsx
│   │   ├── metas/page.tsx
│   │   └── historico/page.tsx
│   ├── (auth)/                       # Login, cadastro e recuperação
│   ├── api/account/                  # Exclusão segura de conta
│   ├── auth/callback/                # Callback seguro do Supabase Auth
│   ├── globals.css                   # Tokens, temas e estilos globais
│   └── layout.tsx
├── features/                         # Organização por domínio/feature
│   ├── README.md                     # Convenção para módulos de feature
│   ├── auth/
│   │   ├── README.md
│   │   ├── providers/                # Estado de sessão autenticada
│   │   ├── ui/                       # Telas e diálogos de conta
│   │   ├── profile-repository.ts     # Perfil e Storage privado
│   │   └── avatar-migration.ts       # Migração base64 legada
│   ├── finance/
│   │   ├── README.md
│   │   ├── domain/                   # Tipos e regras puras
│   │   ├── forms/                    # Zod e normalização de entradas
│   │   ├── data/                     # Mappers e repositórios Supabase
│   │   ├── hooks/                    # Implementação do store
│   │   ├── providers/                # Contrato financeiro compartilhado
│   │   ├── presentation/             # View models e formatação
│   │   └── ui/                       # Rotas, shell e componentes financeiros
│   └── navigation/                   # Fonte de verdade de paths/seções
├── components/ui/                    # Primitives shadcn/Base UI compartilhadas
├── lib/supabase/                     # Clientes browser, server, admin e tipos gerados
├── supabase/
│   ├── migrations/                   # Histórico imutável de migrations
│   ├── schema.sql                    # Referência consolidada do schema
│   └── config.toml                   # Supabase local
├── tests/integration/                # Integração real com Supabase local
├── scripts/                          # Guards e automações determinísticas
├── docs/
│   ├── architecture.md               # Arquitetura detalhada
│   ├── decisions/                    # ADRs versionados
│   ├── specs/                        # Specs locais, nunca versionadas
│   ├── security.md
│   ├── supabase-setup.md
│   └── testing.md
├── .agents/
│   ├── agents/                       # Agents Claude em Markdown
│   ├── skills/                       # Skills compartilhadas
│   └── templates/                    # Templates operacionais, incluindo spec
├── .claude/
│   ├── agents -> ../.agents/agents
│   └── skills -> ../.agents/skills
├── .codex/agents/                    # Agents Codex no formato TOML
├── AGENTS.md                         # Fonte canônica de instruções
└── CLAUDE.md -> AGENTS.md
```

### 3.1 Organização por feature

- Uma feature complexa deve possuir README próprio quando tiver múltiplas camadas, invariantes de
  domínio, persistência ou workflows que não sejam óbvios pela tree.
- O README explica propósito, fronteiras, fluxo de dados, pontos de extensão e testes; não replica
  cada detalhe do código.
- Evite criar README para diretórios triviais sem decisões próprias.
- Prefira feature-first para regras do produto e `components/ui`/`lib` somente para infraestrutura
  realmente compartilhada.
- Não crie barrels amplos que escondam dependências ou provoquem ciclos.

### 3.2 Regra de dependências

```text
app → features → components/lib
finance/ui → presentation/domain + provider
finance/providers/hooks → repositories + domain
finance/data → domain + lib/supabase
finance/domain → nenhuma camada de framework ou infraestrutura
```

- Domínio não importa React, Next.js ou Supabase.
- UI não monta payload SQL e não acessa tabelas diretamente.
- Repositórios não contêm regra visual.
- Server Components e Route Handlers não usam o cliente browser.
- Dependência entre features precisa ser explícita e pequena; extraia para compartilhado apenas
  quando houver mais de um consumidor real.

## 4. Stack e arquitetura

### 4.1 Stack

| Área | Tecnologia |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS v4, shadcn/Base UI, Lucide |
| Linguagem | TypeScript strict |
| Formulários | React Hook Form + Zod |
| Dados/Auth | Supabase Auth, Postgres, RLS e Storage |
| Gráficos | Recharts |
| Testes | Vitest + Testing Library + integração Supabase |
| Qualidade | Biome, ESLint Next/React Hooks, TypeScript |
| Deploy | Vercel + workflow protegido de migrations |

### 4.2 App Router e sessão

- A raiz redireciona para `/dashboard` ou `/login` conforme a sessão.
- `app/(app)/layout.tsx` valida o usuário no servidor com `getCurrentAppUser()`.
- O layout monta `AuthSessionProvider`, `FinanceProvider`, navegação e o slot da rota.
- `FinanceRouteShell` consome os providers e renderiza loading, erro/retry e a shell; não carrega
  tabelas diretamente e não renderiza um dashboard monolítico.
- `features/navigation/routes.ts` é a fonte de verdade para rotas principais.
- Use `Link`, `useRouter` e `usePathname`; não use `history.pushState`, `popstate` ou estado paralelo
  para simular roteamento.

### 4.3 Estado financeiro

O contrato público expõe `state`, `status`, `error`, `retry`, `isPending` e ações agrupadas por
recurso. `useFinanceStore` é implementação, não o contrato público da UI.

- Sete consultas paralelas são permitidas somente no load inicial e retry.
- Loads usam `AbortController`, id monotônico e conferência do usuário.
- Mutações retornam a row persistida e atualizam somente o recurso e snapshots afetados.
- Chaves de pending impedem duplicidade de submissão e ações destrutivas.
- Erros de carga aparecem na UI com retry; não transforme falha em estado vazio silencioso.

### 4.4 Corte vertical financeiro

Uma mudança persistida normalmente atravessa:

1. migration e `supabase/schema.sql`;
2. tipos gerados do Supabase;
3. tipo de domínio;
4. schema Zod e normalização;
5. mapper DB ↔ domínio;
6. repositório tipado;
7. provider/store;
8. cálculo ou view model;
9. UI de rota;
10. testes unitários, integração e QA proporcional.

Use `valion-finance-feature` e, havendo persistência, também `valion-supabase`.

## 5. Setup e ambientes

O projeto deve funcionar em WSL, Linux e macOS. Luis e Isaque usam WSL com Debian, mas diferenças
locais não devem mudar os comandos do projeto; normalize versões por `.nvmrc`, Corepack, lockfile e
Supabase CLI.

### 5.1 Pré-requisitos

- Git com suporte a symlinks.
- NVM ou gerenciador compatível com `.nvmrc`.
- Corepack e pnpm.
- Docker compatível com Supabase CLI.
- Supabase CLI.
- GitHub CLI para o workflow de PR/deploy autorizado.

No WSL, prefira Docker Desktop com integração habilitada para a distro. Não mantenha Docker Desktop
e um segundo Docker Engine publicando as mesmas portas. Em Linux/macOS, use Docker Desktop ou Engine
compatível e confirme que o daemon está acessível ao usuário atual.

### 5.2 Bootstrap

```bash
nvm install
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm dev:all
```

Abra `http://localhost:3000`.

### 5.3 Variáveis

`.env.local` precisa de:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` é server-only. Nunca use prefixo `NEXT_PUBLIC`, nunca leia em Client
Component e nunca imprima seu valor.

### 5.4 Serviços locais

| Serviço | Endereço padrão |
| --- | --- |
| App | `http://localhost:3000` |
| API Supabase | `http://127.0.0.1:55321` |
| Postgres | `127.0.0.1:55322` |
| Studio | `http://127.0.0.1:55323` |
| Mailpit | `http://127.0.0.1:55324` |

Credenciais locais são compartilhadas e a stack pode publicar portas na rede. Use rede confiável e
rode `pnpm supabase:stop` ao terminar.

## 6. Comandos oficiais

| Intenção | Comando |
| --- | --- |
| Ativar Node | `nvm use` |
| Instalar | `pnpm install --frozen-lockfile` |
| Dev app | `pnpm dev` |
| Dev app + Supabase | `pnpm dev:all` |
| Formato/lint/imports | `pnpm check` |
| Correção segura | `pnpm check:write` |
| ESLint complementar | `pnpm lint:eslint` |
| Typecheck | `pnpm typecheck` |
| Testes | `pnpm test` |
| Coverage | `pnpm test:coverage` |
| Build | `pnpm build` |
| Gate sem Docker | `pnpm verify` |
| Subir Supabase | `pnpm supabase:start` |
| Parar Supabase | `pnpm supabase:stop` |
| Reset local | `pnpm supabase:reset` |
| Seed local | `pnpm supabase:seed` |
| Tipos Supabase | `pnpm supabase:types` |
| Integração Supabase | `pnpm test:supabase` |
| Gate Supabase | `pnpm verify:supabase` |
| Config de agents | `pnpm verify:agents` |

Não troque pnpm por npm/yarn e não improvise variantes de comandos sem conferir `package.json`.

## 7. Banco de dados e Supabase

### 7.1 Clientes

| Cliente | Arquivo | Uso |
| --- | --- | --- |
| Browser | `lib/supabase/client.ts` | Client Components, providers e hooks |
| Server | `lib/supabase/server.ts` | Server Components e Route Handlers |
| Admin | `lib/supabase/admin.ts` | Operações server-only com service role |

Todos usam `Database` de `lib/supabase/database.types.ts`.

### 7.2 Migrations

- Crie migration nova; nunca edite migration aplicada.
- Mantenha `supabase/schema.sql` coerente como referência consolidada.
- Aplique localmente com `pnpm supabase:reset`.
- Gere tipos com `pnpm supabase:types` depois das migrations locais.
- Use `Tables`, `TablesInsert` e `TablesUpdate`; não esconda drift com casts.
- Mudança destrutiva exige backup e estratégia corretiva.
- `.env.supabase` não é requisito e permanece ignorado.

### 7.3 RLS e defesa em profundidade

- Toda tabela de usuário mantém RLS e filtro explícito por `user_id`.
- RPC pública deriva identidade de `auth.uid()`; não aceite `user_id` do cliente quando desnecessário.
- Funções `security definer` usam `search_path` seguro e privilégios mínimos.
- Teste acesso cruzado com dois usuários reais no Supabase local.
- Snapshots são derivados pelo banco; usuários autenticados não escrevem diretamente.
- Storage privado usa prefixo do próprio usuário e policies para cada operação.

### 7.4 Produção

Desenvolvimento e testes podem automatizar reset/seed apenas quando a URL foi confirmada como
`localhost` ou `127.0.0.1`.

Produção recebe somente migrations versionadas por `.github/workflows/supabase-migrations.yml`,
com `workflow_dispatch` e GitHub Environment `production`. Dispare somente quando o usuário pedir
explicitamente. Nunca use `supabase db push`, seed remoto, `db reset --linked` ou SQL arbitrário em
produção.

Não exponha `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` ou `SUPABASE_PROJECT_REF`.

## 8. Padrões de código

### 8.1 Princípios

- Escreva primeiro o mínimo de código que resolve corretamente o problema comprovado.
- Depois de provar o comportamento, refatore para clareza, eficiência, segurança e manutenção.
- Prefira código direto a abstrações especulativas.
- Remova APIs sem consumidor e não adicione dependência sem necessidade concreta.
- Otimize algoritmos quando houver impacto ou risco demonstrável; evite micro-otimização obscura.
- Preserve contratos existentes ou documente claramente a mudança.

### 8.2 TypeScript e formato

- TypeScript strict; evite `any` em domínio, payloads e Supabase.
- Use `import type` para símbolos somente de tipos.
- `verbatimModuleSyntax` está habilitado.
- Biome: 2 espaços, LF, largura 100, aspas duplas e semicolon conforme configuração.
- Não duplique regras de estilo no ESLint.
- Imports internos usam `@/*`; relativos ficam em arquivos fortemente acoplados do mesmo módulo.

### 8.3 Componentes e módulos

- Client Components declaram `"use client"`.
- Hooks, `window`, `toast`, router client e Supabase browser ficam no cliente.
- Server Components e Route Handlers usam clientes server-side.
- Um arquivo com cerca de 300 linhas é um alerta para revisar responsabilidades, não uma falha
  automática. Extraia quando houver mais de um motivo para mudar, não para satisfazer contagem.
- Coloque formulários junto da feature/rota proprietária e preserve primitives compartilhadas.
- Não recrie dashboard, store ou arquivo de diálogos monolítico.

### 8.4 Validação e erros

- Normalize entradas com Zod ou validação equivalente na fronteira.
- Valide datas reais, limites numéricos, enums e relações condicionais.
- UI recebe mensagens em pt-BR e não detalhes de SQL, Auth ou Storage.
- Falhas não viram sucesso silencioso, estado vazio ou toast enganoso.
- Não registre valores financeiros, emails completos, tokens ou payloads pessoais.

## 9. Frontend e experiência do usuário

- Use tokens de `app/globals.css`: `background`, `foreground`, `primary`, `muted`, `card`, `chart-*`.
- Preserve a linguagem visual financeira existente; evite cores avulsas e layouts genéricos.
- Toda superfície relevante funciona em light/dark e de mobile a desktop.
- Estados necessários: loading, erro, vazio, dados, pending e sucesso quando aplicável.
- Ações destrutivas usam diálogo acessível, confirmação explícita e pending.
- Navegação por teclado, foco visível, labels, `aria-current`, alerts e leitores de tela são parte do
  comportamento, não polimento posterior.
- Evite layout shift, trabalho síncrono excessivo e rerenderizações globais sem necessidade.

## 10. Testes e QA

### 10.1 Matriz por risco

| Mudança | Validação mínima |
| --- | --- |
| Docs/config simples | check direcionado + `git diff --check` |
| UI/client localizada | `pnpm check`, `pnpm lint:eslint`, `pnpm typecheck`, teste relevante |
| Funcionalidade/regra | testes focados + `pnpm verify` |
| Banco/Auth/Storage | `pnpm verify:supabase` + `pnpm verify` |
| Refatoração ampla | `pnpm test:coverage` + gates acima |
| Agents/skills | `pnpm verify:agents` + evals relevantes |

Coverage bloqueia abaixo de 73% statements, 73% lines, 59% branches e 67% functions. Esses valores
são piso e nunca podem ser reduzidos para fazer o gate passar.

### 10.2 Estratégia de testes

- Regra financeira pura: domain/presentation.
- Entrada e normalização: schemas Zod.
- Contrato banco/domínio: mappers e repositórios.
- Corrida, retry e pending: store/provider.
- Comportamento visual: Testing Library e QA em navegador.
- RLS, constraints, triggers e Storage: Supabase local real, não apenas mocks.
- Bug corrigido recebe teste de regressão que teria falhado antes.

### 10.3 QA com agent-browser

QA real com `agent-browser` é altamente recomendado quando a mudança afeta rotas, navegação,
formulários, Auth, perfil, responsividade, tema ou interação relevante. Ajustes triviais podem usar
validação reduzida, desde que o risco seja explicado.

Use a skill `valion-browser-qa`. Evidências ficam organizadas em `.context/qa-<slug>/`, que é local e
nunca versionado. O relatório usa `PASS`, `FAIL` e `BLOCKED`, inclui ambiente, passos, console/network,
screenshots e reteste.

Excluir conta durante QA sempre exige confirmação explícita do usuário, mesmo com Supabase local e
usuário demo. Nunca execute fluxo destrutivo em ambiente remoto.

## 11. Segurança e privacidade

- Dados financeiros pessoais são sensíveis por padrão.
- Segredos nunca entram em Client Components, logs, commits, screenshots ou respostas de erro.
- Service role permanece exclusivamente server-side.
- Valide sessão no servidor e mantenha RLS como barreira principal.
- Verifique open redirect, CSRF/origin, session confusion e acesso cruzado em mudanças de Auth.
- Avatares são privados, limitados por MIME/tamanho e exibidos por URL assinada.
- Exclusão de conta limpa Storage antes de Auth e interrompe se a limpeza falhar.
- Base64 legado é validado sem logs e removido ou migrado com segurança.
- Dependências e workflows mantêm permissões mínimas; OSV Scanner continua no CI.
- Não use comandos destrutivos de Git ou banco fora do escopo explicitamente autorizado.

## 12. Git, commits e pull requests

- Preserve mudanças locais existentes; trabalho desconhecido pertence ao usuário.
- Não use `git reset --hard`, `git checkout --` ou equivalente destrutivo sem autorização explícita.
- Crie branch ou commit somente quando o usuário pedir.
- Push e PR sempre exigem pedido explícito.
- PRs do Valion usam `main` como base padrão.
- Branches preferem `feat/<slug>`, `fix/<slug>`, `refactor/<slug>` ou tipo Conventional equivalente.
- Commits usam Conventional Commits e descrevem uma unidade coerente.
- Leia o diff completo da branch contra o merge-base antes de escrever o PR.
- Use a skill `create-pr`; não invente labels e não duplique PR aberto.
- O corpo do PR descreve problema, solução, arquitetura/dados, QA, validações e pendências.

## 13. Documentação

| Fonte | Responsabilidade |
| --- | --- |
| `AGENTS.md` | Política, workflow, mapa e invariantes |
| `README.md` | Onboarding e operação rápida do projeto |
| `docs/architecture.md` | Arquitetura e dependências detalhadas |
| `docs/decisions/` | ADRs de decisões duráveis |
| `docs/security.md` | Modelo e regras de segurança |
| `docs/supabase-setup.md` | Setup/operação do Supabase |
| `docs/testing.md` | Estratégia e comandos de teste |
| `features/*/README.md` | Contexto e fronteiras da feature |
| `docs/specs/` | Specs de trabalho locais e não versionadas |
| Skills | Procedimentos especializados para agentes |

Atualize a fonte correta junto com a mudança. Evite copiar detalhes operacionais em vários arquivos;
repita apenas invariantes de segurança cuja visibilidade reduz risco.

## 14. Agents e skills

### 14.1 Organização

- Skills canônicas: `.agents/skills/<nome>/SKILL.md`.
- Claude acessa skills por `.claude/skills`.
- Agents Claude: `.agents/agents/*.md`.
- Agents Codex: `.codex/agents/*.toml`.
- Workspaces de eval: `.agents/skills/*-workspace/`, locais e ignorados.
- `pnpm verify:agents` valida symlinks, paridade de agents, skills e evals.

Markdown Claude e TOML Codex são formatos diferentes; mantenha o objetivo e as proteções equivalentes,
sem tentar compartilhar o mesmo arquivo.

### 14.2 Skills disponíveis

- `valion-finance-feature`: corte vertical financeiro.
- `valion-supabase`: schema, Auth, RLS, Storage, tipos, snapshots e deploy de banco.
- `valion-browser-qa`: QA real local com agent-browser e evidências.
- `create-pr`: push e PR estruturado da branch atual para `main`.

Se uma tarefa persistida for financeira, use finance + Supabase. Se afetar comportamento de UI, avalie
browser QA. Se o usuário pedir PR, use create-pr.

### 14.3 Reviewers

- `quality-reviewer`: corretude, arquitetura, corridas, UX e cobertura.
- `supabase-reviewer`: migrations, RLS, Auth, Storage e integridade.
- `browser-qa-reviewer`: comportamento real, acessibilidade operacional e evidências.

Delegue somente trabalho independente ou ruidoso. A sessão principal continua responsável por integrar,
resolver conflitos, executar gates e comunicar o resultado.

Reviews usam esta estrutura:

1. resumo e escopo;
2. achados por severidade;
3. evidência com arquivo/linha ou passos de reprodução;
4. riscos verificados sem achados;
5. comandos e ambiente;
6. bloqueios e conclusão.

## 15. Definition of Done

Uma entrega está pronta quando, proporcionalmente ao escopo:

- [ ] problema e resultado esperado estão compreendidos;
- [ ] spec local/fluxo reduzido registra decisões suficientes;
- [ ] comportamento atende requisitos e não objetivos;
- [ ] arquitetura e READMEs continuam coerentes;
- [ ] entradas, erros, loading, vazio e pending estão tratados;
- [ ] isolamento por usuário e privacidade foram preservados;
- [ ] testes de regressão e integração relevantes passam;
- [ ] QA em navegador foi executado ou a dispensa foi justificada;
- [ ] `pnpm verify` passa quando há código de aplicação;
- [ ] `pnpm verify:supabase` passa quando há banco/Auth/Storage;
- [ ] `pnpm test:coverage` passa em funcionalidade/refatoração ampla;
- [ ] `pnpm verify:agents` passa ao tocar em agents/skills;
- [ ] documentação correta foi atualizada sem versionar specs/evidências locais;
- [ ] `git diff --check` e `git status` foram revisados;
- [ ] nenhuma credencial, `.env.local`, `.context` ou artefato local entrou no diff;
- [ ] entrega informa validações executadas e pendências reais.
