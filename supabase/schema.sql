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

drop trigger if exists fixed_expenses_set_updated_at on public.fixed_expenses;
create trigger fixed_expenses_set_updated_at
before update on public.fixed_expenses
for each row execute function public.set_updated_at();

drop trigger if exists investment_entries_set_updated_at on public.investment_entries;
create trigger investment_entries_set_updated_at
before update on public.investment_entries
for each row execute function public.set_updated_at();

drop trigger if exists monthly_snapshots_set_updated_at on public.monthly_snapshots;
create trigger monthly_snapshots_set_updated_at
before update on public.monthly_snapshots
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.incomes enable row level security;
alter table public.fixed_expenses enable row level security;
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

create policy "fixed_expenses_select_own" on public.fixed_expenses
for select using (auth.uid() = user_id);

create policy "fixed_expenses_insert_own" on public.fixed_expenses
for insert with check (auth.uid() = user_id);

create policy "fixed_expenses_update_own" on public.fixed_expenses
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "fixed_expenses_delete_own" on public.fixed_expenses
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
