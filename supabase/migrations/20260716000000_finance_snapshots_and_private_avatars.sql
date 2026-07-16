alter table public.incomes
  add column received_on date;

update public.incomes
set received_on = (created_at at time zone 'America/Sao_Paulo')::date
where frequency = 'Única'
  and received_on is null;

alter table public.incomes
  add constraint incomes_received_on_frequency_check check (
    (frequency = 'Única' and received_on is not null)
    or (frequency <> 'Única' and received_on is null)
  );

alter table public.profiles
  add column avatar_path text;

create or replace function public.valion_current_month()
returns date
language sql
stable
set search_path = ''
as $$
  select date_trunc('month', timezone('America/Sao_Paulo', now()))::date;
$$;

create or replace function public.refresh_current_month_snapshot(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_month date := public.valion_current_month();
  total_income numeric(12, 2);
  total_expenses numeric(12, 2);
  planned numeric(12, 2);
  invested numeric(12, 2);
begin
  if not exists (select 1 from auth.users where id = target_user_id) then
    return;
  end if;

  select coalesce(sum(
    case income.frequency
      when 'Quinzenal' then income.amount * 2
      when 'Semanal' then income.amount * 4.33
      else income.amount
    end
  ), 0)
  into total_income
  from public.incomes as income
  where income.user_id = target_user_id
    and (
      income.frequency <> 'Única'
      or date_trunc('month', income.received_on)::date = current_month
    );

  select coalesce(sum(expense.monthly_amount), 0)
  into total_expenses
  from public.fixed_expenses as expense
  where expense.user_id = target_user_id
    and expense.status = 'Ativa';

  select
    coalesce(entry.planned_amount, 0),
    coalesce(entry.invested_amount, 0)
  into planned, invested
  from public.investment_entries as entry
  where entry.user_id = target_user_id
    and entry.month = current_month;

  planned := coalesce(planned, 0);
  invested := coalesce(invested, 0);

  insert into public.monthly_snapshots (
    user_id,
    month,
    income,
    expenses,
    planned_investment,
    invested_amount
  )
  values (
    target_user_id,
    current_month,
    total_income,
    total_expenses,
    planned,
    invested
  )
  on conflict (user_id, month) do update
  set income = excluded.income,
      expenses = excluded.expenses,
      planned_investment = excluded.planned_investment,
      invested_amount = excluded.invested_amount;
end;
$$;

create or replace function public.apply_historical_income_delta(
  target_user_id uuid,
  received_date date,
  income_delta numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_month date := date_trunc('month', received_date)::date;
begin
  if target_month >= public.valion_current_month()
    or not exists (select 1 from auth.users where id = target_user_id)
  then
    return;
  end if;

  insert into public.monthly_snapshots (user_id, month, income)
  values (target_user_id, target_month, income_delta)
  on conflict (user_id, month) do update
  set income = public.monthly_snapshots.income + excluded.income;
end;
$$;

create or replace function public.sync_historical_investment_snapshot(
  target_user_id uuid,
  target_month date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  planned numeric(12, 2) := 0;
  invested numeric(12, 2) := 0;
begin
  if target_month >= public.valion_current_month()
    or not exists (select 1 from auth.users where id = target_user_id)
  then
    return;
  end if;

  select entry.planned_amount, entry.invested_amount
  into planned, invested
  from public.investment_entries as entry
  where entry.user_id = target_user_id
    and entry.month = target_month;

  planned := coalesce(planned, 0);
  invested := coalesce(invested, 0);

  insert into public.monthly_snapshots (
    user_id,
    month,
    planned_investment,
    invested_amount
  )
  values (target_user_id, target_month, planned, invested)
  on conflict (user_id, month) do update
  set planned_investment = excluded.planned_investment,
      invested_amount = excluded.invested_amount;
end;
$$;

-- Historical snapshots that already exist are authoritative and must not be rebuilt.
-- For a month without a snapshot, however, one-time incomes are punctual facts that
-- can be recovered safely before future updates start applying deltas.
insert into public.monthly_snapshots (user_id, month, income)
select
  income.user_id,
  date_trunc('month', income.received_on)::date,
  sum(income.amount)
from public.incomes as income
where income.frequency = 'Única'
  and income.received_on < public.valion_current_month()
group by income.user_id, date_trunc('month', income.received_on)::date
on conflict (user_id, month) do nothing;

create or replace function public.sync_snapshot_after_income_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  refresh_user_id uuid;
begin
  if tg_op <> 'INSERT' then
    if old.frequency = 'Única'
      and date_trunc('month', old.received_on)::date < public.valion_current_month()
    then
      perform public.apply_historical_income_delta(old.user_id, old.received_on, -old.amount);
    else
      refresh_user_id := old.user_id;
    end if;
  end if;

  if tg_op <> 'DELETE' then
    if new.frequency = 'Única'
      and date_trunc('month', new.received_on)::date < public.valion_current_month()
    then
      perform public.apply_historical_income_delta(new.user_id, new.received_on, new.amount);
    else
      refresh_user_id := new.user_id;
    end if;
  end if;

  if refresh_user_id is not null then
    perform public.refresh_current_month_snapshot(refresh_user_id);
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.sync_snapshot_after_expense_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_current_month_snapshot(coalesce(new.user_id, old.user_id));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.sync_snapshot_after_investment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' then
    if old.month < public.valion_current_month() then
      perform public.sync_historical_investment_snapshot(old.user_id, old.month);
    elsif old.month = public.valion_current_month() then
      perform public.refresh_current_month_snapshot(old.user_id);
    end if;
  end if;

  if tg_op <> 'DELETE' then
    if new.month < public.valion_current_month() then
      perform public.sync_historical_investment_snapshot(new.user_id, new.month);
    elsif new.month = public.valion_current_month() then
      perform public.refresh_current_month_snapshot(new.user_id);
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists incomes_sync_snapshot on public.incomes;
create trigger incomes_sync_snapshot
after insert or update or delete on public.incomes
for each row execute function public.sync_snapshot_after_income_change();

drop trigger if exists fixed_expenses_sync_snapshot on public.fixed_expenses;
create trigger fixed_expenses_sync_snapshot
after insert or update or delete on public.fixed_expenses
for each row execute function public.sync_snapshot_after_expense_change();

drop trigger if exists investment_entries_sync_snapshot on public.investment_entries;
create trigger investment_entries_sync_snapshot
after insert or update or delete on public.investment_entries
for each row execute function public.sync_snapshot_after_investment_change();

create or replace function public.ensure_current_month_snapshot()
returns public.monthly_snapshots
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  result public.monthly_snapshots;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  perform public.refresh_current_month_snapshot(current_user_id);

  select snapshot.*
  into result
  from public.monthly_snapshots as snapshot
  where snapshot.user_id = current_user_id
    and snapshot.month = public.valion_current_month();

  return result;
end;
$$;

revoke all on function public.valion_current_month() from public, anon, authenticated;
revoke all on function public.refresh_current_month_snapshot(uuid) from public, anon, authenticated;
revoke all on function public.apply_historical_income_delta(uuid, date, numeric) from public, anon, authenticated;
revoke all on function public.sync_historical_investment_snapshot(uuid, date) from public, anon, authenticated;
revoke all on function public.sync_snapshot_after_income_change() from public, anon, authenticated;
revoke all on function public.sync_snapshot_after_expense_change() from public, anon, authenticated;
revoke all on function public.sync_snapshot_after_investment_change() from public, anon, authenticated;
revoke all on function public.ensure_current_month_snapshot() from public, anon;
grant execute on function public.ensure_current_month_snapshot() to authenticated;

drop policy if exists "monthly_snapshots_insert_own" on public.monthly_snapshots;
drop policy if exists "monthly_snapshots_update_own" on public.monthly_snapshots;
drop policy if exists "monthly_snapshots_delete_own" on public.monthly_snapshots;
revoke insert, update, delete on table public.monthly_snapshots from authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "profile_avatars_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile_avatars_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile_avatars_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile_avatars_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
