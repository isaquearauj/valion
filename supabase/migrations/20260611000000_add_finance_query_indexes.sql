create index if not exists incomes_user_created_at_idx
on public.incomes (user_id, created_at desc);

create index if not exists fixed_expenses_user_created_at_idx
on public.fixed_expenses (user_id, created_at desc);

create index if not exists charge_reminders_user_next_due_date_idx
on public.charge_reminders (user_id, next_due_date asc);

create index if not exists financial_goals_user_created_at_idx
on public.financial_goals (user_id, created_at desc);

create index if not exists goal_contributions_user_date_idx
on public.goal_contributions (user_id, date desc);
