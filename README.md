# Valion

Sistema web moderno para controle financeiro pessoal, criado com Next.js, React, TypeScript, TailwindCSS, shadcn/ui e preparação para Supabase.

## Funcionalidades implementadas

- Autenticação demo com cadastro, login, logout, recuperação simulada, persistência de sessão e exclusão de conta local.
- Dashboard com cards financeiros, resumo do mês, percentual comprometido e insights de investimentos.
- CRUD local de receitas, despesas fixas e investimentos.
- Gráficos interativos com Recharts e shadcn chart.
- Histórico financeiro mensal.
- Light mode, dark mode e layout responsivo.
- Schema Supabase com RLS em `supabase/schema.sql`.

## Rodando localmente

```bash
pnpm dev
```

Abra `http://localhost:3000`.

Use qualquer e-mail e senha com pelo menos 6 caracteres para entrar no modo demo.

## Supabase

O projeto ainda roda com dados locais para facilitar validação visual e funcional sem criar backend imediatamente.

Quando quiser ativar Supabase real, siga `docs/supabase-setup.md`.

## Scripts

- `pnpm dev`: ambiente de desenvolvimento.
- `pnpm lint`: análise estática.
- `pnpm build`: build de produção.

## Estrutura principal

- `components/finance`: dashboard, CRUDs e telas do produto.
- `features/finance`: tipos, schemas, cálculos e store demo.
- `components/ui`: componentes shadcn/ui.
- `lib/supabase`: clientes Supabase preparados.
- `supabase/schema.sql`: tabelas, constraints, triggers e políticas RLS.

## Deploy

Deploy recomendado na Vercel após configurar as variáveis de ambiente do Supabase.
