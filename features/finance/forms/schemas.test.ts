import { describe, expect, it } from "vitest"

import {
  expenseSchema,
  goalContributionSchema,
  goalSchema,
  incomeSchema,
  investmentSchema,
  reminderSchema,
} from "@/features/finance/forms/schemas"

describe("finance schemas", () => {
  it("parses valid income and applies notes default", () => {
    expect(
      incomeSchema.parse({
        amount: "4500.50",
        frequency: "Mensal",
        name: "Salário CLT",
        type: "Salário",
      }),
    ).toEqual({
      amount: 4500.5,
      frequency: "Mensal",
      name: "Salário CLT",
      notes: "",
      receivedOn: null,
      type: "Salário",
    })
  })

  it("requires a real received date only for one-time income", () => {
    const oneTime = { amount: 500, frequency: "Única", name: "Bônus", type: "Renda extra" }

    expect(incomeSchema.safeParse(oneTime).success).toBe(false)
    expect(incomeSchema.parse({ ...oneTime, receivedOn: "2026-02-28" })).toMatchObject({
      receivedOn: "2026-02-28",
    })
    expect(incomeSchema.safeParse({ ...oneTime, receivedOn: "2026-02-30" }).success).toBe(false)
  })

  it("rejects invalid income enums and non-positive amount", () => {
    expect(
      incomeSchema.safeParse({ amount: 0, frequency: "Mensal", name: "OK", type: "Salário" })
        .success,
    ).toBe(false)
    expect(
      incomeSchema.safeParse({ amount: 100, frequency: "Anual", name: "OK", type: "Salário" })
        .success,
    ).toBe(false)
    expect(
      incomeSchema.safeParse({ amount: 100, frequency: "Mensal", name: "OK", type: "Crypto" })
        .success,
    ).toBe(false)
  })

  it("validates expense day, amount and enums", () => {
    const validExpense = {
      category: "Contas fixas",
      dueDay: "31",
      monthlyAmount: "1200",
      name: "Aluguel",
      remainingInstallments: "0",
      status: "Ativa",
      totalInstallments: "0",
    }

    expect(expenseSchema.parse(validExpense)).toMatchObject({ dueDay: 31, monthlyAmount: 1200 })
    expect(expenseSchema.safeParse({ ...validExpense, dueDay: 0 }).success).toBe(false)
    expect(expenseSchema.safeParse({ ...validExpense, dueDay: 32 }).success).toBe(false)
    expect(expenseSchema.safeParse({ ...validExpense, category: "Lazer" }).success).toBe(false)
    expect(expenseSchema.safeParse({ ...validExpense, monthlyAmount: 0 }).success).toBe(false)
    expect(expenseSchema.safeParse({ ...validExpense, remainingInstallments: "1" }).success).toBe(
      false,
    )
    expect(
      expenseSchema.safeParse({
        ...validExpense,
        totalInstallments: "3",
        remainingInstallments: "4",
      }).success,
    ).toBe(false)
  })

  it("accepts recurring reminders with zero installments", () => {
    expect(
      reminderSchema.safeParse({
        amount: 100,
        frequency: "Mensal",
        name: "Cobrar aluguel",
        nextDueDate: "2026-01-10",
        person: "João",
        remainingInstallments: 0,
        status: "Ativo",
        totalInstallments: 0,
        type: "Recorrente",
      }).success,
    ).toBe(true)
  })

  it("enforces parcelled reminder installment rules", () => {
    const parcelledReminder = {
      amount: 100,
      frequency: "Mensal",
      name: "Cobrar parcela",
      nextDueDate: "2026-01-10",
      person: "Maria",
      remainingInstallments: 2,
      status: "Ativo",
      totalInstallments: 3,
      type: "Parcelado",
    }

    expect(reminderSchema.safeParse(parcelledReminder).success).toBe(true)
    expect(reminderSchema.safeParse({ ...parcelledReminder, totalInstallments: 0 }).success).toBe(
      false,
    )
    expect(
      reminderSchema.safeParse({ ...parcelledReminder, remainingInstallments: 0, status: "Ativo" })
        .success,
    ).toBe(false)
    expect(
      reminderSchema.safeParse({ ...parcelledReminder, remainingInstallments: 4 }).success,
    ).toBe(false)
    expect(
      reminderSchema.safeParse({ ...parcelledReminder, nextDueDate: "10/01/2026" }).success,
    ).toBe(false)
    expect(
      reminderSchema.safeParse({ ...parcelledReminder, nextDueDate: "2026-02-30" }).success,
    ).toBe(false)
  })

  it("validates investment month and non-negative amounts", () => {
    expect(
      investmentSchema.parse({
        investedAmount: "100",
        month: "2026-01",
        plannedAmount: "250",
      }),
    ).toEqual({ investedAmount: 100, month: "2026-01", notes: "", plannedAmount: 250 })
    expect(
      investmentSchema.safeParse({ investedAmount: -1, month: "2026-01", plannedAmount: 0 })
        .success,
    ).toBe(false)
    expect(
      investmentSchema.safeParse({ investedAmount: 0, month: "2026-1", plannedAmount: 0 }).success,
    ).toBe(false)
  })

  it("requires a deadline date only when goal deadline is enabled", () => {
    const goal = {
      deadlineDate: "",
      deadlineEnabled: false,
      name: "Reserva",
      status: "Ativa",
      targetAmount: 10000,
    }

    expect(goalSchema.safeParse(goal).success).toBe(true)
    expect(goalSchema.safeParse({ ...goal, deadlineEnabled: true }).success).toBe(false)
    expect(
      goalSchema.safeParse({ ...goal, deadlineDate: "2026-12-31", deadlineEnabled: true }).success,
    ).toBe(true)
    expect(
      goalSchema.safeParse({ ...goal, deadlineDate: "31/12/2026", deadlineEnabled: true }).success,
    ).toBe(false)
    expect(goalSchema.safeParse({ ...goal, targetAmount: 0 }).success).toBe(false)
  })

  it("validates goal contributions", () => {
    expect(
      goalContributionSchema.parse({
        amount: "150",
        date: "2026-01-15",
        goalId: "goal-1",
      }),
    ).toEqual({ amount: 150, date: "2026-01-15", goalId: "goal-1", notes: "" })
    expect(
      goalContributionSchema.safeParse({ amount: 0, date: "2026-01-15", goalId: "goal-1" }).success,
    ).toBe(false)
    expect(
      goalContributionSchema.safeParse({ amount: 10, date: "15/01/2026", goalId: "goal-1" })
        .success,
    ).toBe(false)
    expect(
      goalContributionSchema.safeParse({ amount: 10, date: "2026-01-15", goalId: "" }).success,
    ).toBe(false)
  })
})
