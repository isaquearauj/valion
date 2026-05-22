import type { FinanceState } from "@/features/finance/types"

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

function makeMonthKeyFromOffset(offset: number) {
  return getCurrentMonthKey(addMonths(new Date(), offset))
}

export function createDemoFinanceState(): FinanceState {
  const now = new Date().toISOString()
  const currentMonth = getCurrentMonthKey()

  return {
    expenses: [
      {
        id: "exp-rent",
        name: "Aluguel",
        category: "Contas fixas",
        monthlyAmount: 1850,
        dueDay: 5,
        totalInstallments: 0,
        remainingInstallments: 0,
        status: "Ativa",
        notes: "Contrato residencial principal.",
        createdAt: now,
      },
      {
        id: "exp-health",
        name: "Plano de saúde",
        category: "Contas fixas",
        monthlyAmount: 420,
        dueDay: 12,
        totalInstallments: 0,
        remainingInstallments: 0,
        status: "Ativa",
        notes: "Reajuste previsto para setembro.",
        createdAt: now,
      },
      {
        id: "exp-streaming",
        name: "Streaming e apps",
        category: "Assinaturas",
        monthlyAmount: 126,
        dueDay: 18,
        totalInstallments: 0,
        remainingInstallments: 0,
        status: "Ativa",
        notes: "Revisar assinaturas trimestralmente.",
        createdAt: now,
      },
      {
        id: "exp-notebook",
        name: "Notebook",
        category: "Parcelamentos",
        monthlyAmount: 389,
        dueDay: 22,
        totalInstallments: 12,
        remainingInstallments: 5,
        status: "Ativa",
        notes: "Compra parcelada sem juros.",
        createdAt: now,
      },
      {
        id: "exp-car",
        name: "Financiamento veículo",
        category: "Financiamentos",
        monthlyAmount: 980,
        dueDay: 25,
        totalInstallments: 48,
        remainingInstallments: 31,
        status: "Ativa",
        notes: "Avaliar amortização quando houver excedente.",
        createdAt: now,
      },
    ],
    incomes: [
      {
        id: "inc-salary",
        name: "Salário principal",
        type: "Salário",
        amount: 7200,
        frequency: "Mensal",
        notes: "Recebimento no quinto dia útil.",
        createdAt: now,
      },
      {
        id: "inc-freelance",
        name: "Projeto freelance recorrente",
        type: "Freelance",
        amount: 1350,
        frequency: "Mensal",
        notes: "Contrato de manutenção.",
        createdAt: now,
      },
      {
        id: "inc-extra",
        name: "Renda extra variável",
        type: "Renda extra",
        amount: 320,
        frequency: "Mensal",
        notes: "Venda de itens e cashback.",
        createdAt: now,
      },
    ],
    investments: [
      {
        id: "inv-current",
        month: currentMonth,
        plannedAmount: 1450,
        investedAmount: 1320,
        notes: "Aportes em renda fixa e ETF.",
        createdAt: now,
      },
      {
        id: "inv-1",
        month: makeMonthKeyFromOffset(-1),
        plannedAmount: 1300,
        investedAmount: 1480,
        notes: "Aporte extra com bônus.",
        createdAt: now,
      },
      {
        id: "inv-2",
        month: makeMonthKeyFromOffset(-2),
        plannedAmount: 1200,
        investedAmount: 1200,
        notes: "Meta cumprida.",
        createdAt: now,
      },
      {
        id: "inv-3",
        month: makeMonthKeyFromOffset(-3),
        plannedAmount: 1100,
        investedAmount: 900,
        notes: "Redução por despesa médica.",
        createdAt: now,
      },
    ],
    snapshots: [
      {
        id: "snap-5",
        month: makeMonthKeyFromOffset(-5),
        income: 7810,
        expenses: 3920,
        plannedInvestment: 900,
        investedAmount: 850,
      },
      {
        id: "snap-4",
        month: makeMonthKeyFromOffset(-4),
        income: 8120,
        expenses: 4050,
        plannedInvestment: 1000,
        investedAmount: 1100,
      },
      {
        id: "snap-3",
        month: makeMonthKeyFromOffset(-3),
        income: 7990,
        expenses: 4215,
        plannedInvestment: 1100,
        investedAmount: 900,
      },
      {
        id: "snap-2",
        month: makeMonthKeyFromOffset(-2),
        income: 8420,
        expenses: 3980,
        plannedInvestment: 1200,
        investedAmount: 1200,
      },
      {
        id: "snap-1",
        month: makeMonthKeyFromOffset(-1),
        income: 8870,
        expenses: 4105,
        plannedInvestment: 1300,
        investedAmount: 1480,
      },
    ],
    updatedAt: now,
  }
}
