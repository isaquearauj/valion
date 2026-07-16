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
- `features/finance/data/`: mapeamento e repositórios tipados entre banco e domínio.
- `features/finance/hooks/`: implementação do store com proteção contra respostas antigas.
- `features/finance/providers/`: contrato explícito compartilhado entre as rotas.
- `features/finance/presentation/`: view models e formatação específica da UI.
- `features/finance/ui/`: shell, seções, tabelas, gráficos e diálogos.
- `components/ui/`: primitives shadcn/base-ui. Alterações devem preservar a API
  compartilhada e a acessibilidade.
- `lib/supabase/`: única porta de criação dos clientes Supabase.

Features complexas possuem README próprio com propósito, fluxo, invariantes e
pontos de extensão. Consulte `features/README.md`, `features/auth/README.md` e
`features/finance/README.md`. Esses READMEs documentam fronteiras estáveis, não
uma listagem linha a linha da implementação.

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
5. repositório tipado em `features/finance/data/repositories`;
6. ação agrupada no provider e atualização localizada do recurso;
7. view model e UI de rota;
8. testes unitários e, para banco/RLS, `pnpm verify:supabase`.

Consulte a skill `valion-finance-feature` para o checklist completo.

## Decisões atuais

- App Router e Server Components fazem a barreira inicial de autenticação.
- O provider financeiro sobrevive à navegação do App Router. Sete consultas
  paralelas ocorrem apenas no load/retry; mutações retornam a row persistida e
  atualizam o recurso e os snapshots impactados.
- O contrato público expõe `state`, `status`, `error`, `retry`, `isPending` e
  ações agrupadas. Loads usam abort, id monotônico e conferência do usuário.
- RLS é a barreira principal no banco; filtros por `user_id` continuam
  obrigatórios como defesa em profundidade.
- Vitest é a única stack de testes. Não introduza uma segunda stack sem uma
  necessidade concreta.
- Biome define formato e lint geral; ESLint cobre lacunas específicas do
  framework.

## Rotas e snapshots

`/dashboard`, `/receitas`, `/despesas`, `/investimentos`, `/metas` e
`/historico` renderizam módulos próprios. O layout autenticado mantém sessão,
provider, navegação e o slot da rota; `Link` e `usePathname` são as fontes da
navegação.

O banco é dono de `monthly_snapshots`: recorrências, despesas e investimento do
mês atual atualizam o snapshot corrente; renda única histórica aplica delta no
mês recebido; investimento passado altera somente seus campos. A RPC
`ensure_current_month_snapshot()` deriva o usuário de `auth.uid()`.

## Regras de dependência

- Domínio não depende de UI, Next ou Supabase.
- Data pode depender de domínio, mas domínio não depende de data.
- UI usa presentation/domain e ações do provider; não monta payload SQL.
- Rotas server-side não importam o cliente browser.
- Imports entre módulos usam `@/*`; imports relativos ficam restritos a arquivos
  fortemente acoplados no mesmo diretório.

## Evolução da estrutura

Comece pelo menor módulo que resolve o problema da spec. A separação em domain,
data, state, presentation e UI acontece quando responsabilidades reais surgem;
ela não é um template obrigatório para qualquer feature. Cerca de 300 linhas é
um sinal para revisar coesão, não um limite mecânico.

Decisões duráveis ficam em `docs/decisions`. Specs de trabalho são locais, não
possuem diretório obrigatório, não são versionadas e não substituem ADRs ou
documentação de arquitetura.
