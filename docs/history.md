# Histórico financeiro e snapshots

O histórico do Valion utiliza a tabela `monthly_snapshots` como o registro preservado e imutável do fechamento mensal de cada usuário. O banco de dados PostgreSQL é a autoridade central e proprietário desse histórico.

A RPC PostgreSQL `ensure_current_month_snapshot()` garante a existência ou atualização do snapshot do mês corrente no primeiro carregamento autenticado. Essa RPC nunca recebe `user_id` como argumento livre; a identidade é derivada com segurança da sessão (`auth.uid()`).

---

## 1. Matriz de comportamento por tipo de movimentação

| Tipo de movimentação | Mês atual (corrente) | Mês fechado (histórico) |
| --- | --- | --- |
| **Receitas recorrentes** (Salário, Freelance mensal, etc.) | Atualizam integralmente o snapshot do mês corrente no cálculo de receitas. | **Não retroagem.** Alterar o valor de um salário hoje não altera os meses já fechados no passado. |
| **Receita `Única`** (com `received_on`) | Entra no total de receitas do mês corrente caso `received_on` pertença ao mês. | Aplica apenas o **delta comprovável** (adição, subtração ou exclusão) diretamente sobre o snapshot do respectivo mês histórico de `received_on`. |
| **Despesas fixas & Parcelamentos** | Atualizam o total de despesas do mês corrente (`monthly_amount`). | **Não retroagem.** Mudanças no valor de despesas fixas afetam apenas os meses vigentes e futuros. |
| **Investimentos** (`investment_entries`) | Sincroniza tanto `planned_investment` quanto `invested_amount` no snapshot do mês corrente. | Atualiza **apenas os campos de investimento** (`planned_investment` e `invested_amount`) do snapshot do mês passado; não altera receitas nem despesas já consolidadas. |

---

## 2. Invariantes de integridade histórica

1. **Snapshots passados não sofrem recálculo especulativo:** Recorrências atuais (despesas fixas ou receitas mensais) nunca são projetadas retroativamente em snapshots antigos.
2. **Meses sem snapshot prévio:** Se o usuário cadastrar uma movimentação pontual comprovável (ex: uma receita única) referente a um mês antigo que ainda não possuía snapshot registrado, o snapshot é inicializado com os demais campos em zero, sem inferências arbitrárias.
3. **Segurança e isolamento:** Usuários possuem permissão apenas de leitura (`SELECT`) em seus próprios `monthly_snapshots` via RLS (`auth.uid() = user_id`). As mutações em snapshots são executadas internamente por RPCs e triggers com `SECURITY DEFINER` e `search_path` restrito.
