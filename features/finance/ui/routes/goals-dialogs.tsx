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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GOAL_STATUSES, type Goal, type GoalContribution } from "@/features/finance/domain/types"
import {
  type GoalContributionFormInput,
  type GoalContributionFormValues,
  type GoalFormInput,
  type GoalFormValues,
  goalContributionSchema,
  goalSchema,
} from "@/features/finance/forms/schemas"
import {
  getGoalContributionDefaults,
  getGoalDefaults,
} from "@/features/finance/presentation/dashboard-view-models"
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
    resolver: zodResolver(goalSchema),
  })
  const deadlineEnabled = useWatch({ control: form.control, name: "deadlineEnabled" })
  const selectedStatus = useWatch({ control: form.control, name: "status" })

  useEffect(() => {
    if (open) {
      form.reset(getGoalDefaults(goal))
    }
  }, [form, goal, open])

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
            <Button disabled={form.formState.isSubmitting} type="submit">
              Salvar meta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
    if (open) {
      form.reset(getGoalContributionDefaults(defaultGoalId, goals, contribution))
    }
  }, [contribution, defaultGoalId, form, goals, open])

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
            <Button disabled={form.formState.isSubmitting} type="submit">
              {contribution ? "Salvar alterações" : "Salvar aporte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
