"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useEffect, useMemo } from "react"
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
import { getCurrentMonthKey } from "@/features/finance/domain/initial-data"
import type { InvestmentEntry } from "@/features/finance/domain/types"
import {
  type InvestmentFormInput,
  type InvestmentFormValues,
  investmentSchema,
} from "@/features/finance/forms/schemas"
import {
  addMonthsToMonthKey,
  getAdjacentMonthKeys,
  getInvestmentDefaults,
} from "@/features/finance/presentation/dashboard-view-models"
import { TextInputField } from "@/features/finance/ui/shared/dashboard-primitives"
import { formatMonthChip } from "@/lib/formatters"
import { cn } from "@/lib/utils"

export function InvestmentDialog({
  investment,
  onOpenChange,
  onSubmit,
  open,
}: {
  investment: InvestmentEntry | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: InvestmentFormValues) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<InvestmentFormInput, unknown, InvestmentFormValues>({
    defaultValues: getInvestmentDefaults(investment),
    resolver: zodResolver(investmentSchema),
  })
  const selectedMonth = useWatch({ control: form.control, name: "month" })
  const monthOptions = useMemo(
    () => getAdjacentMonthKeys(selectedMonth ?? getCurrentMonthKey()),
    [selectedMonth],
  )

  useEffect(() => {
    if (open) {
      form.reset(getInvestmentDefaults(investment))
    }
  }, [form, investment, open])

  async function submit(values: InvestmentFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{investment ? "Editar investimento" : "Registrar investimento"}</DialogTitle>
          <DialogDescription>Compare valor planejado e realmente investido.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.month)}>
              <FieldLabel>Mês</FieldLabel>
              <div className="flex items-center gap-2">
                <Button
                  aria-label="Mês anterior"
                  className="shrink-0"
                  onClick={() => {
                    form.setValue(
                      "month",
                      addMonthsToMonthKey(selectedMonth ?? getCurrentMonthKey(), -1),
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <ChevronLeftIcon />
                </Button>
                <div className="grid min-w-0 flex-1 grid-cols-5 gap-2">
                  {monthOptions.map((month) => (
                    <Button
                      aria-pressed={month === (selectedMonth ?? getCurrentMonthKey())}
                      className={cn(
                        "h-8 min-w-0 rounded-full px-2 text-xs",
                        month === (selectedMonth ?? getCurrentMonthKey())
                          ? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      key={month}
                      onClick={() => {
                        form.setValue("month", month, { shouldDirty: true, shouldValidate: true })
                      }}
                      type="button"
                      variant="outline"
                    >
                      <span className="truncate">{formatMonthChip(month)}</span>
                    </Button>
                  ))}
                </div>
                <Button
                  aria-label="Próximo mês"
                  className="shrink-0"
                  onClick={() => {
                    form.setValue(
                      "month",
                      addMonthsToMonthKey(selectedMonth ?? getCurrentMonthKey(), 1),
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <ChevronRightIcon />
                </Button>
              </div>
              <FieldDescription>Escolha rapidamente entre os meses mais próximos.</FieldDescription>
              <FieldError>{form.formState.errors.month?.message}</FieldError>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.plannedAmount}
                label="Valor planejado"
                registration={form.register("plannedAmount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.investedAmount}
                label="Valor investido"
                registration={form.register("investedAmount")}
                type="number"
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={form.formState.isSubmitting} type="submit">
              Salvar investimento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
