import { z } from "zod"

import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  GOAL_STATUSES,
  INCOME_FREQUENCIES,
  INCOME_TYPES,
  REMINDER_FREQUENCIES,
  REMINDER_STATUSES,
  REMINDER_TYPES,
} from "@/features/finance/types"

export const incomeSchema = z.object({
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  frequency: z.enum(INCOME_FREQUENCIES),
  name: z.string().min(2, "Informe um nome com pelo menos 2 caracteres."),
  notes: z.string().max(300).optional().default(""),
  type: z.enum(INCOME_TYPES),
})

export const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  dueDay: z.coerce.number().int().min(1).max(31),
  monthlyAmount: z.coerce.number().positive("Informe um valor maior que zero."),
  name: z.string().min(2, "Informe um nome com pelo menos 2 caracteres."),
  notes: z.string().max(300).optional().default(""),
  remainingInstallments: z.coerce.number().int().min(0),
  status: z.enum(EXPENSE_STATUSES),
  totalInstallments: z.coerce.number().int().min(0),
})

export const reminderSchema = z
  .object({
    amount: z.coerce.number().positive("Informe um valor maior que zero."),
    frequency: z.enum(REMINDER_FREQUENCIES),
    name: z.string().min(2, "Informe um nome com pelo menos 2 caracteres."),
    nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
    notes: z.string().max(300).optional().default(""),
    person: z.string().min(2, "Informe de quem você precisa cobrar."),
    remainingInstallments: z.coerce.number().int().min(0),
    status: z.enum(REMINDER_STATUSES),
    totalInstallments: z.coerce.number().int().min(0),
    type: z.enum(REMINDER_TYPES),
  })
  .superRefine((values, context) => {
    if (values.type === "Recorrente") {
      return
    }

    if (values.totalInstallments <= 0) {
      context.addIssue({
        code: "custom",
        message: "Informe o total de parcelas.",
        path: ["totalInstallments"],
      })
    }

    if (values.remainingInstallments <= 0 && values.status !== "Concluído") {
      context.addIssue({
        code: "custom",
        message: "Parcelas restantes devem ser maiores que zero para lembretes ativos.",
        path: ["remainingInstallments"],
      })
    }

    if (values.remainingInstallments > values.totalInstallments) {
      context.addIssue({
        code: "custom",
        message: "Parcelas restantes não podem exceder o total.",
        path: ["remainingInstallments"],
      })
    }
  })

export const investmentSchema = z.object({
  investedAmount: z.coerce.number().min(0),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Informe um mês válido."),
  notes: z.string().max(300).optional().default(""),
  plannedAmount: z.coerce.number().min(0),
})

export const goalSchema = z.object({
  deadlineEnabled: z.boolean(),
  deadlineDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.").optional().or(z.literal("")),
  name: z.string().min(2, "Informe um nome com pelo menos 2 caracteres."),
  notes: z.string().max(300).optional().default(""),
  status: z.enum(GOAL_STATUSES),
  targetAmount: z.coerce.number().positive("Informe um valor maior que zero."),
}).superRefine((values, context) => {
  if (!values.deadlineEnabled) {
    return
  }

  if (!values.deadlineDate) {
    context.addIssue({
      code: "custom",
      message: "Escolha a data do prazo no calendário.",
      path: ["deadlineDate"],
    })
  }
})

export const goalContributionSchema = z.object({
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  goalId: z.string().min(1, "Selecione uma meta."),
  notes: z.string().max(300).optional().default(""),
})

export type IncomeFormValues = z.infer<typeof incomeSchema>
export type ExpenseFormValues = z.infer<typeof expenseSchema>
export type ReminderFormValues = z.infer<typeof reminderSchema>
export type InvestmentFormValues = z.infer<typeof investmentSchema>
export type GoalFormValues = z.infer<typeof goalSchema>
export type GoalContributionFormValues = z.infer<typeof goalContributionSchema>

export type IncomeFormInput = z.input<typeof incomeSchema>
export type ExpenseFormInput = z.input<typeof expenseSchema>
export type ReminderFormInput = z.input<typeof reminderSchema>
export type InvestmentFormInput = z.input<typeof investmentSchema>
export type GoalFormInput = z.input<typeof goalSchema>
export type GoalContributionFormInput = z.input<typeof goalContributionSchema>
