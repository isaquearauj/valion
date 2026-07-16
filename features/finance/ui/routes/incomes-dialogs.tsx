"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
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
  type ChargeReminder,
  INCOME_FREQUENCIES,
  INCOME_TYPES,
  type Income,
  type IncomeFrequency,
  type IncomeType,
  REMINDER_FREQUENCIES,
  REMINDER_STATUSES,
  REMINDER_TYPES,
  type ReminderFrequency,
  type ReminderStatus,
  type ReminderType,
} from "@/features/finance/domain/types"
import {
  type IncomeFormInput,
  type IncomeFormValues,
  incomeSchema,
  type ReminderFormInput,
  type ReminderFormValues,
  reminderSchema,
} from "@/features/finance/forms/schemas"
import {
  getIncomeDefaults,
  getReminderDefaults,
} from "@/features/finance/presentation/dashboard-view-models"
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
    resolver: zodResolver(incomeSchema),
  })
  const incomeFrequency = useWatch({ control: form.control, name: "frequency" })

  useEffect(() => {
    if (open) {
      form.reset(getIncomeDefaults(income))
    }
  }, [form, income, open])

  async function submit(values: IncomeFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog disablePointerDismissal onOpenChange={onOpenChange} open={open}>
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
            {incomeFrequency === "Única" ? (
              <TextInputField
                error={form.formState.errors.receivedOn}
                label="Data do recebimento"
                registration={form.register("receivedOn")}
                type="date"
              />
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={form.formState.isSubmitting} type="submit">
              Salvar receita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ReminderDialog({
  onOpenChange,
  onSubmit,
  open,
  reminder,
}: {
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ReminderFormValues) => Promise<void> | void
  open: boolean
  reminder: ChargeReminder | null
}) {
  const form = useForm<ReminderFormInput, unknown, ReminderFormValues>({
    defaultValues: getReminderDefaults(reminder),
    resolver: zodResolver(reminderSchema),
  })
  const reminderType = useWatch({ control: form.control, name: "type" })

  useEffect(() => {
    if (open) {
      form.reset(getReminderDefaults(reminder))
    }
  }, [form, open, reminder])

  useEffect(() => {
    if (reminderType === "Recorrente") {
      form.setValue("remainingInstallments", 0)
      form.setValue("totalInstallments", 0)
    }
  }, [form, reminderType])

  async function submit(values: ReminderFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,760px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{reminder ? "Editar lembrete" : "Novo lembrete"}</DialogTitle>
          <DialogDescription>
            Registre cobranças a lembrar sem somar o valor nas receitas do dashboard.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <TextInputField
              error={form.formState.errors.name}
              label="Nome"
              registration={form.register("name")}
            />
            <TextInputField
              error={form.formState.errors.person}
              label="De quem cobrar"
              registration={form.register("person")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="type"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Tipo"
                    onValueChange={(value) => field.onChange(value as ReminderType)}
                    options={REMINDER_TYPES}
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
                    onValueChange={(value) => field.onChange(value as ReminderStatus)}
                    options={REMINDER_STATUSES}
                    value={field.value}
                  />
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.amount}
                label="Valor da cobrança"
                registration={form.register("amount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.nextDueDate}
                label="Próxima cobrança"
                registration={form.register("nextDueDate")}
                type="date"
              />
            </div>
            <Controller
              control={form.control}
              name="frequency"
              render={({ field, fieldState }) => (
                <SelectField
                  error={fieldState.error}
                  label="Periodicidade"
                  onValueChange={(value) => field.onChange(value as ReminderFrequency)}
                  options={REMINDER_FREQUENCIES}
                  value={field.value}
                />
              )}
            />
            {reminderType === "Parcelado" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInputField
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
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={form.formState.isSubmitting} type="submit">
              Salvar lembrete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
