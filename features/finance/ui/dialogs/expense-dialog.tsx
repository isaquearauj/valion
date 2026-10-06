"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
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
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(expenseSchema),
  })

  const [expenseId, setExpenseId] = useState(expense?.id)
  const [isInstallment, setIsInstallment] = useState(
    Boolean(expense && expense.totalInstallments > 0),
  )

  if (expense?.id !== expenseId) {
    setExpenseId(expense?.id)
    setIsInstallment(Boolean(expense && expense.totalInstallments > 0))
  }

  useEffect(() => {
    form.reset(getExpenseDefaults(expense))
  }, [expense, form])

  function handleRemainingChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value)
    if (!Number.isNaN(val)) {
      const current = form.getValues("status")
      if (val <= 0) {
        if (current !== "Quitada") {
          form.setValue("status", "Quitada")
        }
      } else if (current === "Quitada") {
        form.setValue("status", "Ativa")
      }
    }
  }

  function handleTypeChange(type: "recurring" | "installment") {
    if (type === "installment") {
      setIsInstallment(true)
      const currentTotal = form.getValues("totalInstallments")
      if (!currentTotal || currentTotal === 0) {
        form.setValue("totalInstallments", 12)
        form.setValue("remainingInstallments", 12)
      }
      if (form.getValues("status") === "Quitada") {
        form.setValue("status", "Ativa")
      }
    } else {
      setIsInstallment(false)
      form.setValue("totalInstallments", 0)
      form.setValue("remainingInstallments", 0)
      form.clearErrors(["totalInstallments", "remainingInstallments"])
      if (form.getValues("status") === "Quitada") {
        form.setValue("status", "Ativa")
      }
    }
  }

  async function submit(values: ExpenseFormValues) {
    const finalValues: ExpenseFormValues = isInstallment
      ? {
          ...values,
          status:
            values.totalInstallments > 0 && values.remainingInstallments === 0
              ? "Quitada"
              : values.status === "Quitada" && values.remainingInstallments > 0
                ? "Ativa"
                : values.status,
        }
      : {
          ...values,
          remainingInstallments: 0,
          status: values.status === "Quitada" ? "Ativa" : values.status,
          totalInstallments: 0,
        }

    if (
      finalValues.totalInstallments > 0 &&
      finalValues.remainingInstallments > finalValues.totalInstallments
    ) {
      form.setError("remainingInstallments", {
        message: "Parcelas restantes não podem exceder o total.",
        type: "validate",
      })
      return
    }

    await onSubmit(finalValues)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,760px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar despesa" : "Nova despesa"}</DialogTitle>
          <DialogDescription>
            Cadastre contas mensais fixas ou compras parceladas com prazo definido.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            {/* Seletor visual de Tipo de Despesa */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">Tipo de despesa</span>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                <button
                  className={`flex h-8 items-center justify-center rounded-md text-xs font-semibold cursor-pointer transition-all ${
                    !isInstallment
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => handleTypeChange("recurring")}
                  type="button"
                >
                  Recorrente / Contínua
                </button>
                <button
                  className={`flex h-8 items-center justify-center rounded-md text-xs font-semibold cursor-pointer transition-all ${
                    isInstallment
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => handleTypeChange("installment")}
                  type="button"
                >
                  Compra parcelada
                </button>
              </div>
            </div>

            <TextInputField
              error={form.formState.errors.name}
              label="Nome"
              placeholder={
                isInstallment ? "Ex: Notebook, Smartphone..." : "Ex: Aluguel, Internet, Luz..."
              }
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
                label={isInstallment ? "Valor da parcela" : "Valor mensal"}
                registration={form.register("monthlyAmount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.dueDay}
                label="Dia do vencimento"
                registration={form.register("dueDay")}
                type="number"
              />
            </div>

            {isInstallment ? (
              <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-border/80 bg-muted/30 p-3.5">
                <TextInputField
                  error={form.formState.errors.totalInstallments}
                  label="Total de parcelas"
                  placeholder="Ex: 12"
                  registration={form.register("totalInstallments")}
                  type="number"
                />
                <TextInputField
                  error={form.formState.errors.remainingInstallments}
                  label="Parcelas restantes"
                  placeholder="Ex: 8"
                  registration={form.register("remainingInstallments", {
                    onChange: handleRemainingChange,
                  })}
                  type="number"
                />
              </div>
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar despesa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
