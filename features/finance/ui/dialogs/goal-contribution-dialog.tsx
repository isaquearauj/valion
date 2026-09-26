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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Goal, GoalContribution } from "@/features/finance/domain/types"
import {
  type GoalContributionFormInput,
  type GoalContributionFormValues,
  goalContributionSchema,
} from "@/features/finance/forms/schemas"
import { getGoalContributionDefaults } from "@/features/finance/presentation/dashboard-view-models"
import { TextInputField } from "@/features/finance/ui/shared/dashboard-primitives"

export function GoalContributionDialog({
  contribution,
  defaultGoalId,
  goals,
  onOpenChange,
  onSubmit,
  open,
}: {
  contribution: GoalContribution | null
  defaultGoalId: string
  goals: Goal[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: GoalContributionFormValues, id?: string) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<GoalContributionFormInput, unknown, GoalContributionFormValues>({
    defaultValues: getGoalContributionDefaults(defaultGoalId, goals, contribution),
    resolver: zodResolver(goalContributionSchema),
  })
  const selectedGoalId = useWatch({ control: form.control, name: "goalId" })

  useEffect(() => {
    form.reset(getGoalContributionDefaults(defaultGoalId, goals, contribution))
  }, [contribution, defaultGoalId, form, goals])

  async function submit(values: GoalContributionFormValues) {
    await onSubmit(values, contribution?.id)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{contribution ? "Editar aporte" : "Registrar aporte"}</DialogTitle>
          <DialogDescription>
            Lance o valor aportado para atualizar a evolução da meta.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.goalId)}>
              <FieldLabel>Meta</FieldLabel>
              <Select
                items={goals.map((goal) => ({ label: goal.name, value: goal.id }))}
                onValueChange={(value) => {
                  if (value !== null) {
                    form.setValue("goalId", value, { shouldDirty: true, shouldValidate: true })
                  }
                }}
                value={selectedGoalId ?? ""}
              >
                <SelectTrigger
                  aria-invalid={Boolean(form.formState.errors.goalId)}
                  aria-label="Meta"
                >
                  <SelectValue placeholder="Selecione uma meta" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError>{form.formState.errors.goalId?.message}</FieldError>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.amount}
                label="Valor do aporte"
                registration={form.register("amount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.date}
                label="Data do aporte"
                registration={form.register("date")}
                type="date"
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">{contribution ? "Salvar alterações" : "Salvar aporte"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
