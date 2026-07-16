# Arquitetura

## Visão geral

Valion usa Next.js App Router, React, TypeScript e Supabase. O navegador acessa
as tabelas financeiras diretamente com a sessão do usuário; políticas RLS e
filtros explícitos por `user_id` protegem o isolamento entre contas.

```text
app/ rotas e layouts
  -> features/auth autenticação e perfil
  -> features/finance domínio, dados, estado e UI
  -> lib/supabase clientes browser, server e admin
  -> Supabase Auth + Postgres + RLS
```

## Fronteiras

- `app/`: composição de rotas, layouts e Route Handlers. Evite lógica financeira
  pura aqui.
- `features/auth/`: conversão do usuário Supabase para o usuário da aplicação e
  telas de autenticação.
- `features/finance/domain/`: tipos, estado inicial e cálculos puros. Não importa
  React nem clientes Supabase.
- `features/finance/forms/`: schemas Zod e normalização de entradas.
- `features/finance/data/`: tipos de rows e mapeamento entre banco e domínio.
- `features/finance/hooks/`: carregamento e mutações do workspace no cliente.
- `features/finance/presentation/`: view models e formatação específica da UI.
- `features/finance/ui/`: shell, seções, tabelas, gráficos e diálogos.
- `components/ui/`: primitives shadcn/base-ui. Alterações devem preservar a API
  compartilhada e a acessibilidade.
- `lib/supabase/`: única porta de criação dos clientes Supabase.

## Clientes Supabase

| Cliente | Arquivo | Uso permitido |
| --- | --- | --- |
| Browser | `lib/supabase/client.ts` | Client Components e hooks |
| Server | `lib/supabase/server.ts` | Server Components e Route Handlers |
| Admin | `lib/supabase/admin.ts` | Operações server-side que exigem service role |

`SUPABASE_SERVICE_ROLE_KEY` nunca entra em Client Components. Hoje ela é usada
para `DELETE /api/account`, após a sessão ser validada com `getUser()`.

## Fluxo de uma funcionalidade financeira

Uma mudança persistida normalmente atravessa a seguinte sequência:

1. migration nova e atualização de `supabase/schema.sql`;
2. tipo de domínio em `features/finance/domain/types.ts`;
3. schema de formulário em `features/finance/forms/schemas.ts`;
4. row e mapper em `features/finance/data/supabase-mappers.ts`;
5. query ou mutação em `features/finance/hooks/use-finance-store.ts`;
6. view model e UI;
7. testes unitários e, para banco/RLS, `pnpm verify:supabase`.

Consulte a skill `valion-finance-feature` para o checklist completo.

## Decisões atuais

- App Router e Server Components fazem a barreira inicial de autenticação.
- O workspace financeiro é client-side e recarregado após cada mutação. Essa
  abordagem é simples e suficiente para o volume atual, mas deve ser reavaliada
  antes de paginação, colaboração em tempo real ou grandes volumes de dados.
- RLS é a barreira principal no banco; filtros por `user_id` continuam
  obrigatórios como defesa em profundidade.
- Vitest é a única stack de testes. Não introduza uma segunda stack sem uma
  necessidade concreta.
- Biome define formato e lint geral; ESLint cobre lacunas específicas do
  framework.

## Dívida arquitetural conhecida

- `features/finance/ui/dashboard/finance-dashboard.tsx` concentra várias
  seções de produto.
- `features/finance/ui/dashboard/finance-dialogs.tsx` concentra todos os
  formulários modais.
- `use-finance-store.ts` centraliza sete recursos e recarrega todos depois de
  cada mutação.

Esses pontos não justificam uma reescrita ampla durante uma mudança de
toolchain. Ao tocar funcionalmente neles, extraia módulos por seção/recurso,
mantenha a API pública pequena e preserve os testes antes de alterar o fluxo de
dados.

## Regras de dependência

- Domínio não depende de UI, Next ou Supabase.
- Data pode depender de domínio, mas domínio não depende de data.
- UI usa presentation/domain e chama o hook; não monta payload SQL diretamente.
- Rotas server-side não importam o cliente browser.
- Imports entre módulos usam `@/*`; imports relativos ficam restritos a arquivos
  fortemente acoplados no mesmo diretório.
