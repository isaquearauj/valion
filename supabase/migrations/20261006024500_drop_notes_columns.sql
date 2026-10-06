-- Remove colunas de notas que não fazem mais parte do produto
alter table public.incomes drop column if exists notes;
alter table public.charge_reminders drop column if exists notes;
alter table public.fixed_expenses drop column if exists notes;
alter table public.financial_goals drop column if exists notes;
alter table public.goal_contributions drop column if exists notes;
alter table public.investment_entries drop column if exists notes;
