# Valion

Sistema web moderno para controle financeiro pessoal, criado com Next.js, React, TypeScript, TailwindCSS, shadcn/ui, Supabase e deploy na Vercel.

Produção: `https://valionapp.com`

## Funcionalidades implementadas

- Autenticação real com Supabase Auth: cadastro, login, logout, recuperação de senha e exclusão de conta.
- Visão Geral com cards financeiros, resumo do mês, percentual comprometido e insights de investimentos.
- CRUD de receitas, lembretes de cobrança, despesas fixas, investimentos e metas financeiras.
- Persistência real no PostgreSQL do Supabase com RLS por usuário.
- Gráficos interativos com Recharts e shadcn chart.
- Histórico financeiro mensal.
- Identidade visual light mode e layout responsivo.
- Migrations Supabase versionadas com tabelas, triggers e políticas RLS.

## Rodando localmente

Pré-requisitos: NVM e Docker Desktop com integração WSL habilitada para a
distribuição em uso.

```bash
nvm install
nvm use
corepack enable
pnpm install
pnpm dev
```

Abra `http://localhost:3000`.

O ambiente local usa Supabase CLI + Docker:

- API: `http://127.0.0.1:55321`
- Studio: `http://127.0.0.1:55323`
- Mailpit: `http://127.0.0.1:55324`

E-mails de recuperação em desenvolvimento aparecem no Mailpit, sem consumir rate limit do Supabase Cloud.
Para entrar com a conta local de desenvolvimento, rode `pnpm supabase:start` (ou `pnpm supabase:seed` se os serviços já estiverem ativos) e consulte o e-mail e a localização da senha em `docs/supabase-setup.md`.
O seed também cria dados financeiros fictícios para explorar os gráficos, o histórico, as metas e as listagens, sem sobrescrever alterações existentes.
Os serviços locais usam credenciais compartilhadas de desenvolvimento e podem
escutar na interface de rede; use-os apenas em uma rede confiável e rode
`pnpm supabase:stop` quando terminar.

## Verificação e testes

- `pnpm check`: formato, lint Biome e organização de imports.
- `pnpm check:write`: aplica correções seguras do Biome.
- `pnpm lint`: Biome + regras complementares de Next/React no ESLint.
- `pnpm typecheck`: verificação TypeScript.
- `pnpm test`: suíte Vitest padrão.
- `pnpm test:watch`: suíte Vitest em modo interativo.
- `pnpm test:coverage`: gera coverage e aplica thresholds globais que nunca devem ser reduzidos.
- `pnpm test:supabase`: suíte de integração RLS/constraints contra Supabase local.
- `pnpm quality`: Biome, ESLint, typecheck e testes unitários.
- `pnpm verify`: quality gate e build de produção.
- `pnpm verify:supabase`: reset do banco local e testes reais de integração.

## Variáveis de ambiente da aplicação

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` é usada somente server-side para excluir contas reais. Nunca exponha essa chave no cliente.

## Supabase

Para desenvolvimento local, as migrations estão em `supabase/migrations/`. A
baseline é `20260606000000_baseline.sql`. Use:

```bash
pnpm supabase:reset
```

Esse comando recria o banco local a partir das migrations. `.env.supabase` não
é necessário. Consulte `docs/supabase-setup.md` para o fluxo de produção.

Configuração de Auth em produção:

- Site URL: `https://valionapp.com`
- Redirect URLs: `https://valionapp.com/**`, `https://www.valionapp.com/**`, `http://localhost:3000/**`
- Confirmação de e-mail: habilitada
- Troca de e-mail: confirmação no endereço antigo e no novo (*Secure email change*)
- E-mails: Resend via Custom SMTP, templates em `supabase/templates/` (detalhes em `docs/supabase-setup.md`)

## Scripts

- `pnpm dev`: inicia o servidor de desenvolvimento do Next.js.
- `pnpm check`: valida formato, lint e imports com Biome.
- `pnpm check:write`: corrige automaticamente o que for seguro via Biome.
- `pnpm lint`: executa Biome e ESLint.
- `pnpm test`: executa suíte padrão de testes com Vitest.
- `pnpm test:watch`: executa testes em modo interativo.
- `pnpm test:coverage`: relatório de cobertura de código.
- `pnpm test:supabase`: testes de integração com Supabase local.
- `pnpm typecheck`: verificação de tipagem estrita TypeScript.
- `pnpm quality`: checks estáticos, typecheck e testes unitários.
- `pnpm verify`: quality gate completo e build.
- `pnpm verify:supabase`: reset e testes do Supabase local.
- `pnpm build`: build de produção do Next.js.
- `pnpm supabase:start`: sobe os containers do Supabase local no Docker.
- `pnpm supabase:stop`: para os containers locais do Supabase.
- `pnpm supabase:reset`: recria banco local aplicando todas as migrations.
- `pnpm supabase:status`: mostra URLs e chaves de desenvolvimento local.
- `pnpm supabase:types`: regenera os tipos TypeScript a partir do banco local.

Migrations de produção não são aplicadas pelo ambiente local. Depois de um `push` na `main`, o workflow `Supabase migrations` aplica as migrations somente quando o CI desse SHA termina com sucesso. O disparo manual permanece disponível para recuperação operacional. Consulte `docs/supabase-setup.md` para o procedimento completo.

## Estrutura principal

- `features/auth/ui`: telas e fluxos visuais de autenticação.
- `features/finance/ui/routes`: seções e formulários carregados por rota do App Router.
- `features/finance/domain`: tipos, estado inicial e cálculos financeiros.
- `features/finance/forms`: schemas e validações de formulários.
- `features/finance/data`: mapeadores e acesso aos dados financeiros.
- `features/finance/data/repositories`: consultas e mutações Supabase tipadas por recurso.
- `features/finance/providers`: provider compartilhado, status, retry e ações agrupadas.
- `features/finance/presentation`: view models para a apresentação financeira.
- `components/ui`: componentes de interface do design system (shadcn/base-ui).
- `lib/supabase`: clientes Supabase browser, server e admin.
- `lib/supabase/database.types.ts`: contrato gerado pelo Supabase para Row/Insert/Update/RPC.
- `supabase/schema.sql`: tabelas, constraints, triggers e políticas RLS.
- `docs/architecture.md`: fronteiras, fluxo de dados e diagrama de arquitetura.
- `docs/history.md`: semântica de snapshots e integridade do histórico mensal.
- `docs/engineering.md`: workflow de engenharia, qualidade e CI/CD.
- `docs/testing.md`: estratégia de testes e thresholds de cobertura.
- `docs/supabase-setup.md`: setup local e de produção do Supabase.
- `docs/security.md`: regras de segurança e proteção de dados.
- `docs/design-system.md`: identidade visual aprovada, tokens e padrões de interface.

## Deploy

Deploy na Vercel com domínio `valionapp.com`. Configure as mesmas variáveis de ambiente em `Production` e `Preview`.
