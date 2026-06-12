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
- Schema Supabase com tabelas, triggers e políticas RLS em `supabase/schema.sql`.

## Rodando localmente

```bash
pnpm install
pnpm supabase:start
pnpm dev
```

Abra `http://localhost:3000`.

O ambiente local usa Supabase CLI + Docker:

- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- Mailpit: `http://127.0.0.1:54324`

E-mails de recuperação em desenvolvimento aparecem no Mailpit, sem consumir rate limit do Supabase Cloud.

## Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` é usada somente server-side para excluir contas reais. Nunca exponha essa chave no cliente.

## Supabase

Execute `supabase/schema.sql` no SQL Editor do Supabase para criar tabelas, triggers e policies. Se o projeto já tiver o schema antigo, execute ao menos o bloco `handle_new_user` do arquivo para criar perfis automaticamente no cadastro.

Para desenvolvimento local, a migration baseline está em `supabase/migrations/20260606000000_baseline.sql`. Use:

```bash
pnpm supabase:reset
```

Esse comando recria o banco local a partir das migrations.

Configuração de Auth em produção:

- Site URL: `https://valionapp.com`
- Redirect URLs: `https://valionapp.com/**`, `https://www.valionapp.com/**`, `http://localhost:3000/**`
- Confirmação de e-mail: habilitada

## Scripts

- `pnpm dev`: ambiente de desenvolvimento.
- `pnpm lint`: análise estática.
- `pnpm build`: build de produção.
- `pnpm supabase:start`: sobe Supabase local.
- `pnpm supabase:stop`: para Supabase local.
- `pnpm supabase:reset`: recria banco local com migrations.
- `pnpm supabase:status`: mostra URLs e chaves locais.

## Estrutura principal

- `components/finance`: dashboard, CRUDs e telas do produto.
- `features/finance`: tipos, schemas, cálculos, mapeadores e store Supabase.
- `components/ui`: componentes shadcn/ui.
- `lib/supabase`: clientes Supabase browser, server e admin.
- `supabase/schema.sql`: tabelas, constraints, triggers e políticas RLS.

## Deploy

Deploy na Vercel com domínio `valionapp.com`. Configure as mesmas variáveis de ambiente em `Production` e `Preview`.
