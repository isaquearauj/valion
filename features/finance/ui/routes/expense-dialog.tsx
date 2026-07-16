"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  type ExpenseCategory,
  type ExpenseStatus,
  type FixedExpense,
} from "@/features/finance/domain/types"
import {
  type ExpenseFormInput,
  type ExpenseFormValues,
  expenseSchema,
} from "@/features/finance/forms/schemas"
import { getExpenseDefaults } from "@/features/finance/presentation/dashboard-view-models"
import { SelectField, TextInputField } from "@/features/finance/ui/shared/dashboard-primitives"

export function ExpenseDialog({
  expense,
  onOpenChange,
  onSubmit,
  open,
}: {
  expense: FixedExpense | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ExpenseFormValues) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    defaultValues: getExpenseDefaults(expense),
    resolver: zodResolver(expenseSchema),
  })

  useEffect(() => {
    if (open) {
      form.reset(getExpenseDefaults(expense))
    }
  }, [expense, form, open])

  async function submit(values: ExpenseFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,760px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar despesa" : "Nova despesa fixa"}</DialogTitle>
          <DialogDescription>
            Registre compromissos mensais, parcelados ou contínuos.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <TextInputField
              error={form.formState.errors.name}
              label="Nome"
              registration={form.register("name")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Categoria"
                    onValueChange={(value) => field.onChange(value as ExpenseCategory)}
                    options={EXPENSE_CATEGORIES}
                    value={field.value}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="status"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Status"
                    onValueChange={(value) => field.onChange(value as ExpenseStatus)}
                    options={EXPENSE_STATUSES}
                    value={field.value}
                  />
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.monthlyAmount}
                label="Valor mensal"
                registration={form.register("monthlyAmount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.dueDay}
                label="Data de vencimento"
                registration={form.register("dueDay")}
                type="number"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                description="Use 0 para despesas contínuas sem parcelas."
                error={form.formState.errors.totalInstallments}
                label="Total de parcelas"
                registration={form.register("totalInstallments")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.remainingInstallments}
                label="Parcelas restantes"
                registration={form.register("remainingInstallments")}
                type="number"
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={form.formState.isSubmitting} type="submit">
              Salvar despesa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
