-- Atualiza registros existentes de "Consórcio" para "Consórcios"
update public.fixed_expenses
  set category = 'Consórcios'
  where category = 'Consórcio';

alter table public.fixed_expenses
  drop constraint if exists fixed_expenses_category_check;

alter table public.fixed_expenses
  add constraint fixed_expenses_category_check
  check (
    category in (
      'Contas fixas',
      'Assinaturas',
      'Parcelamentos',
      'Consórcios',
      'Seguros',
      'Empréstimos',
      'Financiamentos',
      'Outros'
    )
  );
