# AGENTS.md

## Projeto

- Valion e um app Next.js 16 + React 19 para controle financeiro pessoal, em portugues do Brasil, com Supabase Auth/Postgres/RLS e deploy Vercel em `https://valionapp.com`.
- Use `pnpm` neste repo; `package.json` fixa `packageManager: pnpm@10.28.0` e `.nvmrc` fixa Node `22.22.3`.
- Imports internos usam alias `@/*` apontando para a raiz via `tsconfig.json`.
- Comece por `README.md`, `docs/architecture.md` e o documento especifico da area tocada. Nao redescubra o repo inteiro quando esse mapa ja responder ao trabalho.

## Comandos Verificados

- Ativar a versao correta: `nvm use`.
- Instalar deps de forma reproduzivel: `pnpm install --frozen-lockfile`.
- Dev app apenas: `pnpm dev` e abra `http://localhost:3000`.
- Dev com Supabase local: `pnpm dev:all` ou, em terminais separados, `pnpm supabase:start` e `pnpm dev`.
- Formatar, lintar e organizar imports: `pnpm check`; corrigir automaticamente: `pnpm check:write`.
- Lint completo: `pnpm lint` (`Biome` + regras especificas de Next/React no ESLint).
- Build de producao: `pnpm build`.
- Typecheck: `pnpm typecheck`.
- Quality gate local: `pnpm quality`.
- Verificacao local completa sem Supabase: `pnpm verify`.
- Verificacao do banco local: `pnpm verify:supabase`.
- Testes unitarios/integracao leve: `pnpm test`.
- Coverage: `pnpm test:coverage`.
- Integracao Supabase local: `pnpm test:supabase`.
- A stack padrao de testes do projeto e Vitest.

## Supabase E Ambiente

- `.env.local` precisa de `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e, para exclusao de conta, `SUPABASE_SERVICE_ROLE_KEY` server-side.
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` em Client Components; ela deve ficar restrita a rotas/server-side como `lib/supabase/admin.ts`.
- Supabase local depende da Supabase CLI e Docker. URLs locais do README/config: API `http://127.0.0.1:55321`, DB `55322`, Studio `http://127.0.0.1:55323`, Mailpit/Inbucket `http://127.0.0.1:55324`.
- No WSL, use Docker Desktop com integracao habilitada para a distro. Nao instale um segundo Docker Engine dentro do WSL em paralelo.
- A stack local pode publicar portas em `0.0.0.0` e usa credenciais de desenvolvimento compartilhadas; execute apenas em rede confiavel e pare com `pnpm supabase:stop` quando nao estiver usando.
- Recriar banco local: `supabase db reset --local` ou `pnpm supabase:reset`, que aplica somente migrations em `supabase/migrations/`.
- `.env.supabase` não é necessário e não deve ser documentado como requisito.
- Migrations de produção são aplicadas exclusivamente pelo workflow manual `.github/workflows/supabase-migrations.yml`, com `workflow_dispatch` e GitHub Environment `production`; um agente autorizado pode disparar a Action via `gh workflow run "Supabase migrations" --ref main`, sem pedir clique manual ao usuário. É proibido executar `supabase db push` diretamente contra produção.
- O workflow usa apenas os secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` e `SUPABASE_PROJECT_REF` do Environment `production`; nunca enviar ou registrar esses valores.
- Produção não executa seed, `supabase db reset --linked` ou SQL arbitrário. Migrations já aplicadas não são editadas; crie migrations corretivas e valide alterações destrutivas com backup localmente.
- Para inspeção remota autorizada, use `supabase login`, `supabase link --project-ref <project-ref>` e `supabase db diff --linked`; a senha é interativa. Use `supabase logout` quando terminar.
- `supabase/schema.sql` e migrations devem permanecer coerentes quando alterar tabelas, triggers, constraints ou policies RLS.
- Emails de cadastro/recuperacao em dev aparecem no Mailpit/Inbucket; nao dependem de envio real.

## Arquitetura Real

- `app/` usa App Router. A raiz `app/page.tsx` redireciona para `/dashboard` ou `/login` conforme Supabase user.
- Rotas autenticadas ficam em `app/(app)/...`; `app/(app)/layout.tsx` chama `getCurrentAppUser()` no servidor e redireciona para `/login` se nao houver sessao.
- A shell autenticada e client-side: `features/finance/ui/shell/finance-route-shell.tsx` carrega dados via `useFinanceStore(user.id)` e renderiza `FinanceDashboard`.
- `features/navigation/routes.ts` e a fonte de verdade para paths/secoes do app; atualize-o junto com novas paginas principais.
- Estado e mutacoes financeiras estao centralizados em `features/finance/hooks/use-finance-store.ts`; ele consulta/muta diretamente tabelas Supabase e recarrega o workspace apos cada mutacao.
- Tipos de dominio vivem em `features/finance/domain/types.ts`; validacoes de formularios vivem em `features/finance/forms/schemas.ts`; calculos agregados em `features/finance/domain/calculations.ts`; mapeamento DB<->UI em `features/finance/data/supabase-mappers.ts`.
- Clientes Supabase sao separados: browser em `lib/supabase/client.ts`, server/cookies em `lib/supabase/server.ts`, admin/service-role em `lib/supabase/admin.ts`.
- Callback de Auth permite apenas redirects seguros para `/dashboard` e `/alterar-senha` em `app/auth/callback/route.ts`.
- `features/finance/ui/dashboard/finance-dashboard.tsx` e `finance-dialogs.tsx` ainda concentram UI demais. Nao acrescente novos blocos grandes neles: extraia por secao ou dialogo ao tocar nessas areas, mantendo o comportamento coberto pelos testes existentes.

## Frontend E Design

- UI usa Tailwind CSS v4, shadcn/ui estilo `base-nova`, `components.json` com `rsc: true`, icones Lucide e CSS em `app/globals.css`.
- Tokens de tema, dark mode e cores OKLCH estao em `app/globals.css`; prefira variaveis/tokens existentes (`bg-background`, `text-foreground`, `primary`, `muted`, `card`, `chart-*`) em vez de cores avulsas.
- Componentes shadcn ficam em `components/ui`; preserve o padrao desses wrappers antes de criar componentes base novos.
- Produto e copy estao em pt-BR; mantenha labels, mensagens de erro e toasts em portugues.
- O layout ja suporta light/dark via `ThemeProvider` e `ThemeToggle`; teste visualmente alteracoes em ambos quando mexer em superficies grandes.
- Evite layouts genericos: mantenha a linguagem visual premium/financeira existente, cards com tokens, responsividade e estados de carregamento com `Skeleton`.

## Convencoes De Codigo

- O projeto esta em TypeScript `strict`; mantenha tipos de dominio explicitos e evite `any` para payloads financeiros/Supabase.
- `biome.jsonc` e a fonte de verdade para formato, imports e lint geral: 2 espacos, LF, largura 100, aspas duplas e ponto-e-virgula apenas quando necessario. Nao formate manualmente em outro estilo.
- O ESLint permanece como camada complementar para regras especificas do framework; nao duplique regras de estilo nele.
- Use `import type` quando o simbolo existir apenas no sistema de tipos; `verbatimModuleSyntax` esta habilitado.
- Client Components precisam declarar `"use client"`; hooks, `window`, `toast`, router client-side e Supabase browser ficam apenas neles.
- Server Components/Route Handlers devem usar `createSupabaseServer()`; nao use cliente browser no servidor.
- Ao adicionar CRUD financeiro, atualize em conjunto: schema Zod, tipo de dominio, mapper Supabase, store, UI e migration/schema SQL.
- Preserve filtros por `user_id` nas queries/mutations financeiras alem das policies RLS.
- Evite arquivos de UI monoliticos. Separe orquestracao, secoes, dialogos e componentes de apresentacao quando uma mudanca aumentar responsabilidade ou acoplamento do arquivo.

## Testes

- Toda funcionalidade nova ou alterada precisa ter testes automatizados e ser testada antes da entrega.
- Use Vitest como stack padrao para testes unitarios/integracao leve; nao introduza Jest ou outra stack paralela sem necessidade explicita.
- Priorize testes para regras financeiras puras em `features/finance/domain/calculations.ts`, validacoes Zod em `features/finance/forms/schemas.ts`, mappers DB<->UI e fluxos criticos de auth/permissao.
- Bugs corrigidos devem receber teste de regressao cobrindo o comportamento que falhava.
- Quando uma mudanca depender de Supabase/local services, documente no resultado se o teste foi automatizado, manual ou bloqueado por ambiente.
- Coverage e gerado por `pnpm test:coverage`; no momento nao ha threshold global bloqueante.
- Mudancas de banco/auth devem validar `pnpm supabase:reset` e, quando Docker estiver disponivel, `pnpm test:supabase`.

## Seguranca

- Este projeto manipula dados financeiros pessoais; trate seguranca e privacidade como requisito central, nao como detalhe posterior.
- Nunca envie segredos para Client Components, logs, bundle publico ou respostas de erro. `SUPABASE_SERVICE_ROLE_KEY` deve permanecer apenas server-side.
- Preserve isolamento por usuario em todas as leituras/escritas: mantenha filtros por `user_id`, valide sessao no servidor e nao confie apenas na UI; RLS e defesa em profundidade.
- Valide e normalize entradas com Zod ou validacao equivalente antes de persistir dados financeiros; nao aceite payloads livres do cliente.
- Evite mensagens de erro que revelem detalhes sensiveis de banco, auth, tokens, chaves ou existencia de recursos de outro usuario.
- Ao alterar auth, redirects, cookies ou rotas server-side, cheque riscos de open redirect, session confusion, CSRF em mutacoes e acesso indevido entre contas.
- Nao registre valores financeiros pessoais, emails completos, tokens ou payloads sensiveis em `console.log`, analytics ou traces persistentes.

## Verificacao Antes De Entregar

- Para mudancas de UI/client simples: rode `pnpm check`, `pnpm lint:eslint` e `pnpm typecheck`.
- Para funcionalidades novas/alteradas: rode ou adicione testes Vitest relevantes e informe o comando executado.
- Para mudancas em build, rotas server ou env: rode `pnpm verify` quando as variaveis de ambiente necessarias estiverem disponiveis.
- Para mudancas de banco: rode `pnpm supabase:reset` com Docker/Supabase local disponivel e confirme que migrations aplicam limpas.
- Antes de entregar, rode `git diff --check` e revise `git status`; nao inclua `.env.local`, artefatos de build, credenciais ou metadados locais.

## Agentes E Skills Do Projeto

- `CLAUDE.md` e um symlink para este arquivo; mantenha uma unica fonte de verdade.
- Skills compartilhadas vivem em `.agents/skills`; `.claude/skills` aponta para esse diretorio.
- Agentes Claude vivem canonicamente em `.agents/agents`; `.claude/agents` aponta para esse diretorio.
- Agentes Codex usam o formato oficial TOML separado em `.codex/agents`; os formatos de Claude e Codex nao sao intercambiaveis.
- Use a skill `valion-supabase` para schema, migrations, RLS, auth, exclusao de conta e fluxo de deploy do banco.
- Use a skill `valion-finance-feature` para mudancas verticais de funcionalidades financeiras.
- Delegue para agentes especializados apenas quando a tarefa for realmente independente ou gerar muito ruido; a sessao principal continua responsavel por integrar e validar o resultado.
