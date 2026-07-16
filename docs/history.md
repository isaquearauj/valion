# Histórico financeiro

O histórico usa `monthly_snapshots` como registro mensal preservado. A RPC
`ensure_current_month_snapshot()` cria ou atualiza o mês corrente no primeiro
carregamento autenticado e nunca recebe `user_id`; o banco deriva o dono pela
sessão.

- Receitas recorrentes e despesas fixas atualizam integralmente apenas o mês atual.
- Receita `Única` entra somente no mês de `received_on`; em mês fechado, insert,
  update ou delete aplica apenas o delta comprovável.
- Investimento do mês atual integra o snapshot corrente. Em mês passado, somente
  `planned_investment` e `invested_amount` são sincronizados.
- Snapshots históricos existentes não são recalculados com recorrências atuais.

Meses antigos sem snapshot não permitem reconstrução precisa das recorrências.
Quando uma correção pontual comprovável cria esse mês, os demais campos começam
em zero e não são inferidos.
