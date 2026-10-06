import { createHash } from "node:crypto"

const seedVersion = "valion-local-demo-v1"

function demoId(userId, resource, key) {
  const bytes = createHash("sha256").update(`${seedVersion}:${userId}:${resource}:${key}`).digest()
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.subarray(0, 16).toString("hex")

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function addMonths(monthKey, offset) {
  const [year, month] = monthKey.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1 + offset, 1, 12)).toISOString().slice(0, 7)
}

function addDays(dateKey, offset) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

function currentDateKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).formatToParts(new Date())
  const part = (type) => parts.find((item) => item.type === type)?.value

  return `${part("year")}-${part("month")}-${part("day")}`
}

export function buildDemoData(userId, dateKey = currentDateKey()) {
  const currentMonth = dateKey.slice(0, 7)
  const pastMonths = [-5, -4, -3, -2, -1].map((offset) => addMonths(currentMonth, offset))
  const historicalValues = [
    { income: 7280, expenses: 3650, planned: 950, invested: 900 },
    { income: 7520, expenses: 3820, planned: 1050, invested: 1080 },
    { income: 7680, expenses: 3970, planned: 1150, invested: 1090 },
    { income: 7850, expenses: 3890, planned: 1250, invested: 1310 },
    { income: 7930, expenses: 4210, planned: 1400, invested: 1360 },
  ]

  const snapshots = pastMonths.map((month, index) => ({
    id: demoId(userId, "monthly_snapshots", month),
    user_id: userId,
    month: `${month}-01`,
    income: historicalValues[index].income,
    expenses: historicalValues[index].expenses,
    planned_investment: historicalValues[index].planned,
    invested_amount: historicalValues[index].invested,
  }))

  const incomeSpecs = [
    { name: "Salário", type: "Salário", amount: 6500, frequency: "Mensal" },
    { name: "Projetos freelance", type: "Freelance", amount: 950, frequency: "Mensal" },
    { name: "Aulas particulares", type: "Renda extra", amount: 650, frequency: "Mensal" },
  ]
  const incomes = incomeSpecs.map((income) => ({
    ...income,
    id: demoId(userId, "incomes", income.name),
    user_id: userId,
    received_on: null,
    notes: "Valor fictício para explorar o Valion.",
  }))

  const expenseSpecs = [
    ["Aluguel", "Contas fixas", 1890, 5, 0, 0, "Ativa"],
    ["Mercado", "Outros", 980, 8, 0, 0, "Ativa"],
    ["Energia elétrica", "Contas fixas", 215, 12, 0, 0, "Ativa"],
    ["Internet", "Contas fixas", 119, 15, 0, 0, "Ativa"],
    ["Celular", "Contas fixas", 89, 18, 0, 0, "Ativa"],
    ["Academia", "Assinaturas", 129, 10, 0, 0, "Ativa"],
    ["Streaming", "Assinaturas", 59, 22, 0, 0, "Ativa"],
    ["Financiamento do carro", "Financiamentos", 620, 20, 48, 28, "Ativa"],
    ["Curso de idiomas", "Parcelamentos", 280, 25, 12, 7, "Ativa"],
    ["Consórcio de imóvel", "Consórcio", 650, 14, 0, 0, "Ativa"],
    ["Consórcio de veículo", "Consórcio", 450, 26, 0, 0, "Ativa"],
    ["Clube de livros", "Assinaturas", 45, 17, 0, 0, "Pausada"],
  ]
  const expenses = expenseSpecs.map(
    ([
      name,
      category,
      monthlyAmount,
      dueDay,
      totalInstallments,
      remainingInstallments,
      status,
    ]) => ({
      id: demoId(userId, "fixed_expenses", name),
      user_id: userId,
      name,
      category,
      monthly_amount: monthlyAmount,
      due_day: dueDay,
      total_installments: totalInstallments,
      remaining_installments: remainingInstallments,
      status,
      notes: "Exemplo de despesa para visualização.",
    }),
  )

  const investmentValues = [
    ...pastMonths.map((month, index) => ({
      month,
      planned: historicalValues[index].planned,
      invested: historicalValues[index].invested,
    })),
    { month: currentMonth, planned: 1500, invested: 1320 },
  ]
  const investments = investmentValues.map((entry) => ({
    id: demoId(userId, "investment_entries", entry.month),
    user_id: userId,
    month: `${entry.month}-01`,
    planned_amount: entry.planned,
    invested_amount: entry.invested,
    notes: "Comparativo mensal fictício.",
  }))

  const goalSpecs = [
    ["Reserva de emergência", 25000, null],
    ["Viagem de férias", 8000, `${addMonths(currentMonth, 8)}-15`],
    ["Novo notebook", 6500, `${addMonths(currentMonth, 3)}-20`],
  ]
  const goals = goalSpecs.map(([name, targetAmount, targetDate]) => ({
    id: demoId(userId, "financial_goals", name),
    user_id: userId,
    name,
    target_amount: targetAmount,
    target_date: targetDate,
    status: "Ativa",
    notes: "Objetivo fictício de demonstração.",
  }))
  const goalByName = new Map(goals.map((goal) => [goal.name, goal.id]))
  const contributionSpecs = [
    ["Reserva de emergência", -5, 900],
    ["Reserva de emergência", -4, 900],
    ["Reserva de emergência", -3, 1000],
    ["Reserva de emergência", -2, 950],
    ["Reserva de emergência", -1, 1100],
    ["Reserva de emergência", 0, 1250],
    ["Viagem de férias", -3, 700],
    ["Viagem de férias", -1, 850],
    ["Viagem de férias", 0, 900],
    ["Novo notebook", -2, 1500],
    ["Novo notebook", -1, 1800],
    ["Novo notebook", 0, 1700],
  ]
  const contributions = contributionSpecs.map(([goalName, offset, amount]) => {
    const month = addMonths(currentMonth, offset)
    return {
      id: demoId(userId, "goal_contributions", `${goalName}:${month}`),
      user_id: userId,
      goal_id: goalByName.get(goalName),
      amount,
      date: offset === 0 ? dateKey : `${month}-12`,
      notes: "Aporte fictício de demonstração.",
    }
  })

  const reminderSpecs = [
    {
      name: "Reembolso compartilhado",
      person: "Ana (exemplo)",
      type: "Recorrente",
      amount: 180,
      frequency: "Mensal",
      next_due_date: addDays(dateKey, 3),
      total_installments: 0,
      remaining_installments: 0,
      status: "Ativo",
    },
    {
      name: "Venda parcelada",
      person: "Marcos (exemplo)",
      type: "Parcelado",
      amount: 320,
      frequency: "Mensal",
      next_due_date: addDays(dateKey, -2),
      total_installments: 4,
      remaining_installments: 2,
      status: "Ativo",
    },
    {
      name: "Mensalidade de curso",
      person: "Joana (exemplo)",
      type: "Recorrente",
      amount: 150,
      frequency: "Mensal",
      next_due_date: addDays(dateKey, 12),
      total_installments: 0,
      remaining_installments: 0,
      status: "Pausado",
    },
  ]
  const reminders = reminderSpecs.map((reminder) => ({
    ...reminder,
    id: demoId(userId, "charge_reminders", reminder.name),
    user_id: userId,
    notes: "Cobrança fictícia de demonstração.",
  }))

  return {
    currentMonth: `${currentMonth}-01`,
    snapshots,
    incomes,
    expenses,
    investments,
    goals,
    contributions,
    reminders,
  }
}

async function insertMissing(client, table, userId, rows, uniqueColumn) {
  const ids = rows.map((row) => row.id)
  const { data: existingIds, error: idsError } = await client
    .from(table)
    .select("id")
    .eq("user_id", userId)
    .in("id", ids)
  if (idsError) throw new Error(`Falha ao consultar ${table} no seed local.`, { cause: idsError })

  const existingIdSet = new Set((existingIds ?? []).map((row) => row.id))
  let existingUniqueSet = new Set()
  if (uniqueColumn) {
    const { data: existingUnique, error: uniqueError } = await client
      .from(table)
      .select(uniqueColumn)
      .eq("user_id", userId)
      .in(
        uniqueColumn,
        rows.map((row) => row[uniqueColumn]),
      )
    if (uniqueError)
      throw new Error(`Falha ao consultar ${table} no seed local.`, { cause: uniqueError })
    existingUniqueSet = new Set((existingUnique ?? []).map((row) => row[uniqueColumn]))
  }

  const missing = rows.filter(
    (row) =>
      !existingIdSet.has(row.id) && (!uniqueColumn || !existingUniqueSet.has(row[uniqueColumn])),
  )
  if (!missing.length) return 0

  const { error } = await client.from(table).insert(missing)
  if (error) throw new Error(`Falha ao cadastrar ${table} no seed local.`, { cause: error })
  return missing.length
}

export async function seedDemoData(admin, client, userId) {
  const demo = buildDemoData(userId)

  await insertMissing(admin, "monthly_snapshots", userId, demo.snapshots, "month")
  await insertMissing(client, "incomes", userId, demo.incomes)
  await insertMissing(client, "fixed_expenses", userId, demo.expenses)
  await insertMissing(client, "financial_goals", userId, demo.goals)
  await insertMissing(client, "goal_contributions", userId, demo.contributions)
  await insertMissing(client, "charge_reminders", userId, demo.reminders)

  const { data: existingSnapshots, error: snapshotError } = await client
    .from("monthly_snapshots")
    .select("id,month")
    .eq("user_id", userId)
    .in(
      "month",
      demo.snapshots.map((row) => row.month),
    )
  if (snapshotError) throw new Error("Falha ao conferir histórico local.", { cause: snapshotError })
  const seededSnapshotIds = new Map(demo.snapshots.map((row) => [row.month, row.id]))
  const untouchedHistoricalMonths = new Set(
    (existingSnapshots ?? [])
      .filter((row) => row.id !== seededSnapshotIds.get(row.month))
      .map((row) => row.month),
  )
  const safeInvestments = demo.investments.filter(
    (row) => row.month === demo.currentMonth || !untouchedHistoricalMonths.has(row.month),
  )
  await insertMissing(client, "investment_entries", userId, safeInvestments, "month")

  const { data, error } = await client.rpc("ensure_current_month_snapshot")
  if (error || !data) throw new Error("Não foi possível confirmar o resumo mensal do seed local.")

  return demo
}
