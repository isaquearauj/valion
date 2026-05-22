import { z } from "zod"

import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  INCOME_FREQUENCIES,
  INCOME_TYPES,
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

export const investmentSchema = z.object({
  investedAmount: z.coerce.number().min(0),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Informe um mês válido."),
  notes: z.string().max(300).optional().default(""),
  plannedAmount: z.coerce.number().min(0),
})

export type IncomeFormValues = z.infer<typeof incomeSchema>
export type ExpenseFormValues = z.infer<typeof expenseSchema>
export type InvestmentFormValues = z.infer<typeof investmentSchema>

export type IncomeFormInput = z.input<typeof incomeSchema>
export type ExpenseFormInput = z.input<typeof expenseSchema>
export type InvestmentFormInput = z.input<typeof investmentSchema>
