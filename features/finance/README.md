# Finance

Este módulo é dono das regras financeiras, persistência do workspace, estado compartilhado e
experiência das rotas autenticadas.

## Camadas

| Pasta | Responsabilidade |
| --- | --- |
| `domain` | tipos e cálculos puros |
| `forms` | schemas Zod e normalização |
| `data` | mappers e repositórios tipados |
| `hooks` | implementação do store e concorrência |
| `providers` | contrato público compartilhado |
| `presentation` | view models e formatação |
| `ui/routes` | seção e formulários de cada rota |
| `ui/shell` | navegação, loading e erro global |

## Fluxo de dados

```text
page.tsx
  → componente de rota
  → useFinance()
  → FinanceProvider / useFinanceStore
  → repositório do recurso
  → Supabase com RLS
  → row persistida
  → atualização localizada do estado
```

O load/retry executa as sete consultas do workspace. Mutações não repetem o load completo: retornam
a row persistida, atualizam o recurso afetado e recarregam snapshots somente quando necessário.

## Invariantes financeiras

- Receita `Única` exige `receivedOn` e aparece apenas no mês recebido.
- Recorrências persistem `received_on = null`.
- O banco é dono de `monthly_snapshots`.
- Recorrências e despesas alteram somente o snapshot corrente.
- Renda única histórica aplica delta comprovável no mês correto.
- Investimento histórico altera somente campos de investimento.
- Snapshots históricos existentes não são recalculados com recorrências atuais.
- Toda consulta/mutação mantém filtro explícito por `user_id` além da RLS.

## Estado e concorrência

O contrato `FinanceStore` expõe `state`, `status`, `error`, `retry`, `isPending` e ações agrupadas.
Loads usam abort, id monotônico e conferência do usuário. Action keys impedem submissões duplicadas.

## Como estender

Use a skill `valion-finance-feature`. Se houver persistência, use também `valion-supabase`. Comece
pela regra/contrato e atravesse apenas as camadas necessárias; não recrie store, dashboard ou
diálogos monolíticos.

## Testes relevantes

- domain/presentation para cálculos;
- forms para entradas e datas reais;
- mappers/repositories para contrato DB ↔ domínio;
- store/provider para concorrência, erro, retry e pending;
- `pnpm verify:supabase` para integridade e RLS;
- `valion-browser-qa` para rotas e CRUDs reais.
