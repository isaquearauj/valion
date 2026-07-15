# Valion

Sistema web moderno para controle financeiro pessoal, criado com Next.js, React, TypeScript, TailwindCSS, shadcn/ui, Supabase e deploy na Vercel.

Produção: `https://valionapp.com`

## Funcionalidades implementadas

- Autenticação real com Supabase Auth: cadastro, login, logout, recuperação de senha e exclusão de conta.
- Dashboard com cards financeiros, resumo do mês, percentual comprometido e insights de investimentos.
- CRUD de receitas, lembretes de cobrança, despesas fixas, investimentos e metas financeiras.
- Persistência real no PostgreSQL do Supabase com RLS por usuário.
- Gráficos interativos com Recharts e shadcn chart.
- Histórico financeiro mensal.
- Light mode, dark mode e layout responsivo.
- Migrations Supabase versionadas com tabelas, triggers e políticas RLS.

## Rodando localmente

```bash
pnpm install
pnpm supabase:start
pnpm dev
```

Abra `http://localhost:3000`.

O ambiente local usa Supabase CLI + Docker:

- API: `http://127.0.0.1:55321`
- Studio: `http://127.0.0.1:55323`
- Mailpit: `http://127.0.0.1:55324`

E-mails de recuperação em desenvolvimento aparecem no Mailpit, sem consumir rate limit do Supabase Cloud.

## Verificação E Testes

- `pnpm lint`: análise estática.
- `pnpm exec tsc --noEmit`: typecheck.
- `pnpm typecheck`: verificação TypeScript.
- `pnpm test`: suíte Vitest padrão.
- `pnpm test:coverage`: gera coverage sem threshold global bloqueante.
- `pnpm test:supabase`: suíte opt-in de integração RLS/constraints contra Supabase local.
- `pnpm quality`: lint, typecheck e testes unitários.

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

## Scripts

- `pnpm dev`: ambiente de desenvolvimento.
- `pnpm lint`: análise estática.
- `pnpm test`: suíte padrão.
- `pnpm test:coverage`: coverage da suíte padrão.
- `pnpm test:supabase`: integração Supabase local.
- `pnpm typecheck`: verificação TypeScript.
- `pnpm quality`: lint, typecheck e testes unitários.
- `pnpm build`: build de produção.
- `pnpm supabase:start`: sobe Supabase local.
- `pnpm supabase:stop`: para Supabase local.
- `pnpm supabase:reset`: recria banco local com migrations.
- `pnpm supabase:seed`: carrega dados demonstrativos no Supabase local.
- `pnpm supabase:reset:seed`: recria banco e carrega dados demonstrativos.
- `pnpm supabase:status`: mostra URLs e chaves locais.

Migrations de produção não são aplicadas pelo ambiente local. Depois de validar uma nova migration com `pnpm supabase:reset` e `pnpm test:supabase`, um agente autorizado pode disparar o workflow `Supabase migrations` via `gh workflow run --ref main`. Consulte `docs/supabase-setup.md` para o procedimento completo.

## Estrutura principal

- `features/auth/ui`: telas e fluxos visuais de autenticação.
- `features/finance/ui`: dashboard, CRUDs e telas do produto.
- `features/finance/domain`: tipos, estado inicial e cálculos financeiros.
- `features/finance/forms`: schemas e validações de formulários.
- `features/finance/data`: mapeadores e acesso aos dados financeiros.
- `features/finance/hooks`: estado client-side e mutações financeiras.
- `features/finance/presentation`: view models para a apresentação financeira.
- `components/ui`: componentes shadcn/ui.
- `lib/supabase`: clientes Supabase browser, server e admin.
- `supabase/schema.sql`: tabelas, constraints, triggers e políticas RLS.

## Deploy

Deploy na Vercel com domínio `valionapp.com`. Configure as mesmas variáveis de ambiente em `Production` e `Preview`.
