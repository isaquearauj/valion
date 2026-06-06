# Valion

Sistema web moderno para controle financeiro pessoal, criado com Next.js, React, TypeScript, TailwindCSS, shadcn/ui e preparação para Supabase.

## Funcionalidades implementadas

- Autenticação com cadastro, login, logout, recuperação de senha, persistência de sessão e exclusão de conta.
- Dashboard com cards financeiros, resumo do mês, percentual comprometido e insights de investimentos.
- CRUD de receitas, lembretes de cobrança, despesas fixas, investimentos e metas financeiras.
- Gráficos interativos com Recharts e shadcn chart.
- Histórico financeiro mensal.
- Light mode, dark mode e layout responsivo.
- Schema Supabase com RLS em `supabase/schema.sql`.

## Rodando localmente

```bash
pnpm dev
```

Abra `http://localhost:3000`.

Use um e-mail válido e uma senha com pelo menos 6 caracteres para acessar o painel.

## Supabase

O projeto está preparado para integração com Supabase e mantém uma camada de persistência temporária durante a fase de implementação.

Quando quiser ativar Supabase real, siga `docs/supabase-setup.md`.

## Scripts

- `pnpm dev`: ambiente de desenvolvimento.
- `pnpm lint`: análise estática.
- `pnpm build`: build de produção.

## Estrutura principal

- `components/finance`: dashboard, CRUDs e telas do produto.
- `features/finance`: tipos, schemas, cálculos e store financeiro.
- `components/ui`: componentes shadcn/ui.
- `lib/supabase`: clientes Supabase preparados.
- `supabase/schema.sql`: tabelas, constraints, triggers e políticas RLS.

## Deploy

Deploy recomendado na Vercel após configurar as variáveis de ambiente do Supabase.
