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
  REMINDER_FREQUENCIES,
  REMINDER_STATUSES,
  REMINDER_TYPES,
  type ReminderFrequency,
  type ReminderStatus,
  type ReminderType,
} from "@/features/finance/domain/types"
import {
  type ReminderFormInput,
  type ReminderFormValues,
  reminderSchema,
} from "@/features/finance/forms/schemas"
import { getReminderDefaults } from "@/features/finance/presentation/dashboard-view-models"
import { SelectField, TextInputField } from "@/features/finance/ui/shared/dashboard-primitives"

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
    form.reset(getReminderDefaults(reminder))
  }, [form, reminder])

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
            <Button type="submit">Salvar lembrete</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
