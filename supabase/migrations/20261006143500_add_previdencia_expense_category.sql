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
      'Previdência',
      'Empréstimos',
      'Financiamentos',
      'Outros'
    )
  );
