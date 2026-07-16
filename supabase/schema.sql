create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Salário', 'Freelance', 'Pensão', 'Renda extra', 'Mesada', 'Outros')),
  amount numeric(12,2) not null check (amount >= 0),
  frequency text not null check (frequency in ('Mensal', 'Quinzenal', 'Semanal', 'Única')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.charge_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  person text not null,
  type text not null check (type in ('Recorrente', 'Parcelado')),
  amount numeric(12,2) not null check (amount >= 0),
  frequency text not null check (frequency in ('Mensal', 'Quinzenal', 'Semanal')),
  next_due_date date not null,
  total_installments integer not null default 0 check (total_installments >= 0),
  remaining_installments integer not null default 0 check (remaining_installments >= 0),
  status text not null check (status in ('Ativo', 'Pausado', 'Concluído')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint charge_reminders_installments_check check (
    (
      type = 'Recorrente'
      and total_installments = 0
      and remaining_installments = 0
    )
    or (
      type = 'Parcelado'
      and total_installments > 0
      and remaining_installments <= total_installments
    )
  )
);

create table if not exists public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (category in ('Contas fixas', 'Assinaturas', 'Parcelamentos', 'Empréstimos', 'Financiamentos', 'Outros')),
  monthly_amount numeric(12,2) not null check (monthly_amount >= 0),
  due_day integer not null check (due_day between 1 and 31),
  total_installments integer not null default 0 check (total_installments >= 0),
  remaining_installments integer not null default 0 check (remaining_installments >= 0),
  status text not null check (status in ('Ativa', 'Pausada', 'Quitada')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixed_expenses_installments_check check (
    total_installments = 0 or remaining_installments <= total_installments
  )
);

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  target_date date,
  status text not null check (status in ('Ativa', 'Pausada', 'Concluída')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.financial_goals(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  date date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  planned_amount numeric(12,2) not null default 0 check (planned_amount >= 0),
  invested_amount numeric(12,2) not null default 0 check (invested_amount >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create table if not exists public.monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  income numeric(12,2) not null default 0,
  expenses numeric(12,2) not null default 0,
  planned_investment numeric(12,2) not null default 0,
  invested_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

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

alter table public.financial_goals
  drop constraint if exists financial_goals_id_user_id_key;

alter table public.financial_goals
  add constraint financial_goals_id_user_id_key unique (id, user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists incomes_set_updated_at on public.incomes;
create trigger incomes_set_updated_at
before update on public.incomes
for each row execute function public.set_updated_at();

drop trigger if exists charge_reminders_set_updated_at on public.charge_reminders;
create trigger charge_reminders_set_updated_at
before update on public.charge_reminders
for each row execute function public.set_updated_at();

drop trigger if exists fixed_expenses_set_updated_at on public.fixed_expenses;
create trigger fixed_expenses_set_updated_at
before update on public.fixed_expenses
for each row execute function public.set_updated_at();

drop trigger if exists financial_goals_set_updated_at on public.financial_goals;
create trigger financial_goals_set_updated_at
before update on public.financial_goals
for each row execute function public.set_updated_at();

drop trigger if exists goal_contributions_set_updated_at on public.goal_contributions;
create trigger goal_contributions_set_updated_at
before update on public.goal_contributions
for each row execute function public.set_updated_at();

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

drop trigger if exists investment_entries_set_updated_at on public.investment_entries;
create trigger investment_entries_set_updated_at
before update on public.investment_entries
for each row execute function public.set_updated_at();

drop trigger if exists monthly_snapshots_set_updated_at on public.monthly_snapshots;
create trigger monthly_snapshots_set_updated_at
before update on public.monthly_snapshots
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.incomes enable row level security;
alter table public.charge_reminders enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.financial_goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.investment_entries enable row level security;
alter table public.monthly_snapshots enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles
for delete using (auth.uid() = id);

create policy "incomes_select_own" on public.incomes
for select using (auth.uid() = user_id);

create policy "incomes_insert_own" on public.incomes
for insert with check (auth.uid() = user_id);

create policy "incomes_update_own" on public.incomes
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "incomes_delete_own" on public.incomes
for delete using (auth.uid() = user_id);

create policy "charge_reminders_select_own" on public.charge_reminders
for select using (auth.uid() = user_id);

create policy "charge_reminders_insert_own" on public.charge_reminders
for insert with check (auth.uid() = user_id);

create policy "charge_reminders_update_own" on public.charge_reminders
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "charge_reminders_delete_own" on public.charge_reminders
for delete using (auth.uid() = user_id);

create policy "fixed_expenses_select_own" on public.fixed_expenses
for select using (auth.uid() = user_id);

create policy "fixed_expenses_insert_own" on public.fixed_expenses
for insert with check (auth.uid() = user_id);

create policy "fixed_expenses_update_own" on public.fixed_expenses
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "fixed_expenses_delete_own" on public.fixed_expenses
for delete using (auth.uid() = user_id);

create policy "financial_goals_select_own" on public.financial_goals
for select using (auth.uid() = user_id);

create policy "financial_goals_insert_own" on public.financial_goals
for insert with check (auth.uid() = user_id);

create policy "financial_goals_update_own" on public.financial_goals
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "financial_goals_delete_own" on public.financial_goals
for delete using (auth.uid() = user_id);

create policy "goal_contributions_select_own" on public.goal_contributions
for select using (auth.uid() = user_id);

create policy "goal_contributions_insert_own" on public.goal_contributions
for insert with check (auth.uid() = user_id);

create policy "goal_contributions_update_own" on public.goal_contributions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goal_contributions_delete_own" on public.goal_contributions
for delete using (auth.uid() = user_id);

create policy "investment_entries_select_own" on public.investment_entries
for select using (auth.uid() = user_id);

create policy "investment_entries_insert_own" on public.investment_entries
for insert with check (auth.uid() = user_id);

create policy "investment_entries_update_own" on public.investment_entries
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "investment_entries_delete_own" on public.investment_entries
for delete using (auth.uid() = user_id);

create policy "monthly_snapshots_select_own" on public.monthly_snapshots
for select using (auth.uid() = user_id);

create policy "monthly_snapshots_insert_own" on public.monthly_snapshots
for insert with check (auth.uid() = user_id);

create policy "monthly_snapshots_update_own" on public.monthly_snapshots
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "monthly_snapshots_delete_own" on public.monthly_snapshots
for delete using (auth.uid() = user_id);

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
