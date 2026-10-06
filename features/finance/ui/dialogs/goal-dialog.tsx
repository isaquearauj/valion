"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { GOAL_STATUSES, type Goal } from "@/features/finance/domain/types"
import {
  type GoalFormInput,
  type GoalFormValues,
  goalSchema,
} from "@/features/finance/forms/schemas"
import { getGoalDefaults } from "@/features/finance/presentation/dashboard-view-models"
import { SelectField, TextInputField } from "@/features/finance/ui/shared/dashboard-primitives"

export function GoalDialog({
  goal,
  onOpenChange,
  onSubmit,
  open,
}: {
  goal: Goal | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: GoalFormValues) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<GoalFormInput, unknown, GoalFormValues>({
    defaultValues: getGoalDefaults(goal),
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(goalSchema),
  })
  const deadlineEnabled = useWatch({ control: form.control, name: "deadlineEnabled" })
  const selectedStatus = useWatch({ control: form.control, name: "status" })

  useEffect(() => {
    form.reset(getGoalDefaults(goal))
  }, [form, goal])

  useEffect(() => {
    if (!deadlineEnabled) {
      form.setValue("deadlineDate", "", { shouldDirty: true })
    }
  }, [deadlineEnabled, form])

  async function submit(values: GoalFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Criar meta"}</DialogTitle>
          <DialogDescription>
            Defina o objetivo financeiro, o prazo e o status da sua meta.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <TextInputField
              error={form.formState.errors.name}
              label="Nome da meta"
              registration={form.register("name")}
            />
            <TextInputField
              error={form.formState.errors.targetAmount}
              label="Valor alvo"
              registration={form.register("targetAmount")}
              type="number"
            />
            <Field
              data-invalid={Boolean(
                form.formState.errors.deadlineEnabled || form.formState.errors.deadlineDate,
              )}
            >
              <FieldLabel>Prazo</FieldLabel>
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    aria-pressed={!deadlineEnabled}
                    onClick={() => form.setValue("deadlineEnabled", false, { shouldDirty: true })}
                    size="sm"
                    type="button"
                    variant={!deadlineEnabled ? "default" : "outline"}
                  >
                    Sem prazo
                  </Button>
                  <Button
                    aria-pressed={deadlineEnabled}
                    onClick={() => form.setValue("deadlineEnabled", true, { shouldDirty: true })}
                    size="sm"
                    type="button"
                    variant={deadlineEnabled ? "default" : "outline"}
                  >
                    Com prazo
                  </Button>
                </div>
                {deadlineEnabled ? (
                  <TextInputField
                    error={form.formState.errors.deadlineDate}
                    label="Data do prazo"
                    registration={form.register("deadlineDate")}
                    type="date"
                  />
                ) : null}
                <FieldDescription>
                  Se preferir, lance a meta sem prazo para acompanhar apenas o progresso.
                </FieldDescription>
              </div>
            </Field>
            <SelectField
              error={form.formState.errors.status}
              label="Status"
              onValueChange={(value) => form.setValue("status", value, { shouldDirty: true })}
              options={GOAL_STATUSES}
              value={selectedStatus ?? "Ativa"}
            />
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar meta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
