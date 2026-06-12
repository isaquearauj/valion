alter table public.financial_goals
  drop constraint if exists financial_goals_id_user_id_key;

alter table public.financial_goals
  add constraint financial_goals_id_user_id_key unique (id, user_id);

alter table public.goal_contributions
  drop constraint if exists goal_contributions_goal_id_fkey;

alter table public.goal_contributions
  add constraint goal_contributions_goal_id_fkey
  foreign key (goal_id, user_id)
  references public.financial_goals (id, user_id)
  on delete cascade;

alter table public.fixed_expenses
  drop constraint if exists fixed_expenses_installments_check;

alter table public.fixed_expenses
  add constraint fixed_expenses_installments_check check (
    (
      total_installments = 0
      and remaining_installments = 0
    )
    or (
      total_installments > 0
      and remaining_installments <= total_installments
    )
  );
