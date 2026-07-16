-- RLS policies only run after PostgreSQL grants the API role access to a table.
-- Keep anonymous clients out and let authenticated requests reach the per-user policies.
revoke all privileges on table
  public.profiles,
  public.incomes,
  public.charge_reminders,
  public.fixed_expenses,
  public.financial_goals,
  public.goal_contributions,
  public.investment_entries,
  public.monthly_snapshots
from anon;

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on table
  public.profiles,
  public.incomes,
  public.charge_reminders,
  public.fixed_expenses,
  public.financial_goals,
  public.goal_contributions,
  public.investment_entries,
  public.monthly_snapshots
to authenticated;

grant all privileges on table
  public.profiles,
  public.incomes,
  public.charge_reminders,
  public.fixed_expenses,
  public.financial_goals,
  public.goal_contributions,
  public.investment_entries,
  public.monthly_snapshots
to service_role;
