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
  INCOME_FREQUENCIES,
  INCOME_TYPES,
  type Income,
  type IncomeFrequency,
  type IncomeType,
} from "@/features/finance/domain/types"
import {
  type IncomeFormInput,
  type IncomeFormValues,
  incomeSchema,
} from "@/features/finance/forms/schemas"
import { getIncomeDefaults } from "@/features/finance/presentation/dashboard-view-models"
import { SelectField, TextInputField } from "@/features/finance/ui/shared/dashboard-primitives"

export function IncomeDialog({
  income,
  onOpenChange,
  onSubmit,
  open,
}: {
  income: Income | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: IncomeFormValues) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<IncomeFormInput, unknown, IncomeFormValues>({
    defaultValues: getIncomeDefaults(income),
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(incomeSchema),
  })

  useEffect(() => {
    form.reset(getIncomeDefaults(income))
  }, [form, income])

  async function submit(values: IncomeFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{income ? "Editar receita" : "Nova receita"}</DialogTitle>
          <DialogDescription>
            Cadastre entradas mensais e frequências recorrentes.
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
                name="type"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Categoria"
                    onValueChange={(value) => field.onChange(value as IncomeType)}
                    options={INCOME_TYPES}
                    value={field.value}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="frequency"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Frequência"
                    onValueChange={(value) => field.onChange(value as IncomeFrequency)}
                    options={INCOME_FREQUENCIES}
                    value={field.value}
                  />
                )}
              />
            </div>
            <TextInputField
              error={form.formState.errors.amount}
              label="Valor"
              registration={form.register("amount")}
              type="number"
            />
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar receita</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
