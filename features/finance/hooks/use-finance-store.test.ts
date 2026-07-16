import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useFinanceStore } from "@/features/finance/hooks/use-finance-store"
import { createSupabaseBrowser } from "@/lib/supabase/client"

type QueryError = { message: string }
type QueryResult = { data: unknown[] | null; error: QueryError | null }
type Operation = {
  action: "delete" | "insert" | "select" | "update" | "upsert"
  filters: Array<[string, unknown]>
  order?: { column: string; options?: unknown }
  payload?: unknown
  select?: string
  table: string
  upsertOptions?: unknown
}

const supabaseState = vi.hoisted(() => ({
  client: null as unknown,
}))

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowser: vi.fn(() => supabaseState.client),
}))

const createSupabaseBrowserMock = vi.mocked(createSupabaseBrowser)

const emptyRows = {
  charge_reminders: [],
  financial_goals: [],
  fixed_expenses: [],
  goal_contributions: [],
  incomes: [],
  investment_entries: [],
  monthly_snapshots: [],
} satisfies Record<string, unknown[]>

function createSupabaseMock({
  mutationError = null,
  rows = {},
  selectErrorTable = null,
}: {
  mutationError?: QueryError | null
  rows?: Partial<Record<keyof typeof emptyRows, unknown[]>>
  selectErrorTable?: keyof typeof emptyRows | null
} = {}) {
  const operations: Operation[] = []
  const tableRows = { ...emptyRows, ...rows }

  class QueryBuilder implements PromiseLike<QueryResult> {
    operation: Operation

    constructor(table: string) {
      this.operation = {
        action: "select",
        filters: [],
        table,
      }
      operations.push(this.operation)
    }

    delete() {
      this.operation.action = "delete"
      return this
    }

    eq(column: string, value: unknown) {
      this.operation.filters.push([column, value])
      return this
    }

    insert(payload: unknown) {
      this.operation.action = "insert"
      this.operation.payload = payload
      return this
    }

    order(column: string, options?: unknown) {
      this.operation.order = { column, options }
      return Promise.resolve(this.resolve())
    }

    select(columns: string) {
      this.operation.action = "select"
      this.operation.select = columns
      return this
    }

    // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are intentionally thenable.
    then<TResult1 = QueryResult, TResult2 = never>(
      onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
      return Promise.resolve(this.resolve()).then(onfulfilled, onrejected)
    }

    update(payload: unknown) {
      this.operation.action = "update"
      this.operation.payload = payload
      return this
    }

    upsert(payload: unknown, options?: unknown) {
      this.operation.action = "upsert"
      this.operation.payload = payload
      this.operation.upsertOptions = options
      return this
    }

    private resolve(): QueryResult {
      if (this.operation.action === "select") {
        return {
          data:
            this.operation.table === selectErrorTable
              ? null
              : tableRows[this.operation.table as keyof typeof emptyRows],
          error:
            this.operation.table === selectErrorTable
              ? { message: "Falha ao carregar dados." }
              : null,
        }
      }

      return { data: null, error: mutationError }
    }
  }

  const client = {
    from: vi.fn((table: string) => new QueryBuilder(table)),
  }

  return {
    client,
    operations,
    resetOperations() {
      operations.length = 0
    },
  }
}

function getLastOperation(operations: Operation[], table: string, action: Operation["action"]) {
  const operation = operations.findLast((item) => item.table === table && item.action === action)

  if (!operation) {
    throw new Error(`Operation ${action} on ${table} not found`)
  }

  return operation
}

async function renderReadyStore(userId = "user-1", mock = createSupabaseMock()) {
  supabaseState.client = mock.client
  const hook = renderHook(() => useFinanceStore(userId))

  await waitFor(() => expect(hook.result.current.isReady).toBe(true))
  mock.resetOperations()

  return { ...hook, mock }
}

describe("useFinanceStore", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseState.client = null
  })

  it("returns an empty ready workspace without querying Supabase when user is missing", async () => {
    const mock = createSupabaseMock()
    supabaseState.client = mock.client

    const { result } = renderHook(() => useFinanceStore(null))

    await waitFor(() => expect(result.current.isReady).toBe(true))
    expect(createSupabaseBrowserMock).toHaveBeenCalledTimes(1)
    expect(mock.client.from).not.toHaveBeenCalled()
    expect(result.current.state).toMatchObject({
      expenses: [],
      goalContributions: [],
      goals: [],
      incomes: [],
      investments: [],
      reminders: [],
      snapshots: [],
    })
  })

  it("loads every finance table with user_id filters and maps rows", async () => {
    const mock = createSupabaseMock({
      rows: {
        fixed_expenses: [
          {
            category: "Contas fixas",
            created_at: "2026-01-02T00:00:00.000Z",
            due_day: 10,
            id: "expense-1",
            monthly_amount: "1200",
            name: "Aluguel",
            notes: null,
            remaining_installments: 0,
            status: "Ativa",
            total_installments: 0,
            updated_at: "2026-01-03T00:00:00.000Z",
          },
        ],
        incomes: [
          {
            amount: "5000",
            created_at: "2026-01-01T00:00:00.000Z",
            frequency: "Mensal",
            id: "income-1",
            name: "Salário",
            notes: null,
            type: "Salário",
            updated_at: "2026-01-04T00:00:00.000Z",
          },
        ],
        investment_entries: [
          {
            created_at: "2026-01-01T00:00:00.000Z",
            id: "investment-1",
            invested_amount: "100",
            month: "2026-01-01",
            notes: null,
            planned_amount: "200",
          },
        ],
      },
    })
    supabaseState.client = mock.client

    const { result } = renderHook(() => useFinanceStore("user-1"))

    await waitFor(() => expect(result.current.isReady).toBe(true))

    expect(
      mock.operations
        .filter((operation) => operation.action === "select")
        .map((operation) => operation.table),
    ).toEqual([
      "incomes",
      "fixed_expenses",
      "charge_reminders",
      "investment_entries",
      "financial_goals",
      "goal_contributions",
      "monthly_snapshots",
    ])
    expect(
      mock.operations.every((operation) =>
        operation.filters.some(([column, value]) => column === "user_id" && value === "user-1"),
      ),
    ).toBe(true)
    expect(result.current.state.incomes[0]).toMatchObject({
      amount: 5000,
      id: "income-1",
      notes: "",
    })
    expect(result.current.state.expenses[0]).toMatchObject({ id: "expense-1", monthlyAmount: 1200 })
    expect(result.current.state.investments[0]).toMatchObject({
      id: "investment-1",
      month: "2026-01",
    })
    expect(result.current.state.updatedAt).toBe("2026-01-04T00:00:00.000Z")
  })

  it("exposes load errors from failed table queries", async () => {
    const mock = createSupabaseMock({ selectErrorTable: "incomes" })
    supabaseState.client = mock.client

    const { result } = renderHook(() => useFinanceStore("user-1"))

    await waitFor(() => expect(result.current.isReady).toBe(true))
    expect(result.current.error).toBe("Falha ao carregar dados.")
  })

  it("writes create/update/delete payloads with user_id defense-in-depth filters", async () => {
    const { mock, result } = await renderReadyStore()

    await act(async () => {
      await result.current.upsertIncome({
        amount: 1000,
        frequency: "Mensal",
        name: "Salário",
        notes: "",
        type: "Salário",
      })
    })
    expect(getLastOperation(mock.operations, "incomes", "insert").payload).toEqual({
      amount: 1000,
      frequency: "Mensal",
      name: "Salário",
      notes: "",
      type: "Salário",
      user_id: "user-1",
    })

    await act(async () => {
      await result.current.upsertExpense(
        {
          category: "Assinaturas",
          dueDay: 5,
          monthlyAmount: 50,
          name: "Streaming",
          notes: "",
          remainingInstallments: 0,
          status: "Ativa",
          totalInstallments: 0,
        },
        "expense-1",
      )
    })
    const expenseUpdate = getLastOperation(mock.operations, "fixed_expenses", "update")
    expect(expenseUpdate.payload).toMatchObject({
      due_day: 5,
      monthly_amount: 50,
      user_id: "user-1",
    })
    expect(expenseUpdate.filters).toEqual([
      ["id", "expense-1"],
      ["user_id", "user-1"],
    ])

    await act(async () => {
      await result.current.upsertInvestment({
        investedAmount: 100,
        month: "2026-02",
        notes: "",
        plannedAmount: 200,
      })
    })
    const investmentUpsert = getLastOperation(mock.operations, "investment_entries", "upsert")
    expect(investmentUpsert.payload).toMatchObject({
      invested_amount: 100,
      month: "2026-02-01",
      planned_amount: 200,
      user_id: "user-1",
    })
    expect(investmentUpsert.upsertOptions).toEqual({ onConflict: "user_id,month" })

    await act(async () => {
      await result.current.upsertGoal({
        name: "Reserva",
        notes: "",
        status: "Ativa",
        targetAmount: 1000,
        targetDate: null,
      })
      await result.current.upsertGoalContribution({
        amount: 100,
        date: "2026-01-10",
        goalId: "goal-1",
        notes: "",
      })
      await result.current.deleteGoalContribution("contribution-1")
    })
    expect(getLastOperation(mock.operations, "financial_goals", "insert").payload).toMatchObject({
      target_amount: 1000,
      user_id: "user-1",
    })
    expect(getLastOperation(mock.operations, "goal_contributions", "insert").payload).toMatchObject(
      { goal_id: "goal-1", user_id: "user-1" },
    )
    expect(getLastOperation(mock.operations, "goal_contributions", "delete").filters).toEqual([
      ["id", "contribution-1"],
      ["user_id", "user-1"],
    ])
  })

  it("clears workspace tables using user_id filters", async () => {
    const { mock, result } = await renderReadyStore()

    await act(async () => {
      await result.current.clearWorkspace()
    })

    const deletes = mock.operations.filter((operation) => operation.action === "delete")
    expect(deletes.map((operation) => operation.table)).toEqual([
      "goal_contributions",
      "monthly_snapshots",
      "investment_entries",
      "financial_goals",
      "fixed_expenses",
      "charge_reminders",
      "incomes",
    ])
    expect(
      deletes.every((operation) =>
        operation.filters.some(([column, value]) => column === "user_id" && value === "user-1"),
      ),
    ).toBe(true)
  })

  it("resets the workspace by clearing the same user-scoped tables", async () => {
    const { mock, result } = await renderReadyStore()

    await act(async () => {
      await result.current.resetWorkspace()
    })

    expect(mock.operations.filter((operation) => operation.action === "delete")).toHaveLength(7)
    expect(
      mock.operations.filter((operation) => operation.action === "delete")[0]?.filters,
    ).toEqual([["user_id", "user-1"]])
  })

  it("filters id-based reminder and finance mutations by user_id", async () => {
    const { mock, result } = await renderReadyStore()

    await act(async () => {
      await result.current.upsertReminder(
        {
          amount: 100,
          frequency: "Semanal",
          name: "Cobrança",
          nextDueDate: "2026-01-10",
          notes: "",
          person: "Ana",
          remainingInstallments: 2,
          status: "Ativo",
          totalInstallments: 4,
          type: "Parcelado",
        },
        "reminder-1",
      )
      await result.current.upsertGoalContribution(
        { amount: 150, date: "2026-01-11", goalId: "goal-1", notes: "aporte" },
        "contribution-1",
      )
      await result.current.upsertInvestment(
        { investedAmount: 100, month: "2026-03", notes: "", plannedAmount: 200 },
        "investment-1",
      )
      await result.current.deleteIncome("income-1")
      await result.current.deleteReminder("reminder-1")
      await result.current.deleteExpense("expense-1")
      await result.current.deleteInvestment("investment-1")
      await result.current.deleteGoal("goal-1")
    })

    expect(getLastOperation(mock.operations, "charge_reminders", "update").payload).toMatchObject({
      next_due_date: "2026-01-10",
      person: "Ana",
      user_id: "user-1",
    })
    expect(getLastOperation(mock.operations, "charge_reminders", "update").filters).toEqual([
      ["id", "reminder-1"],
      ["user_id", "user-1"],
    ])
    expect(getLastOperation(mock.operations, "goal_contributions", "update").filters).toEqual([
      ["id", "contribution-1"],
      ["user_id", "user-1"],
    ])
    expect(getLastOperation(mock.operations, "investment_entries", "update").filters).toEqual([
      ["id", "investment-1"],
      ["user_id", "user-1"],
    ])
    expect(getLastOperation(mock.operations, "incomes", "delete").filters).toEqual([
      ["id", "income-1"],
      ["user_id", "user-1"],
    ])
    expect(getLastOperation(mock.operations, "charge_reminders", "delete").filters).toEqual([
      ["id", "reminder-1"],
      ["user_id", "user-1"],
    ])
    expect(getLastOperation(mock.operations, "fixed_expenses", "delete").filters).toEqual([
      ["id", "expense-1"],
      ["user_id", "user-1"],
    ])
    expect(getLastOperation(mock.operations, "investment_entries", "delete").filters).toEqual([
      ["id", "investment-1"],
      ["user_id", "user-1"],
    ])
    expect(getLastOperation(mock.operations, "financial_goals", "delete").filters).toEqual([
      ["id", "goal-1"],
      ["user_id", "user-1"],
    ])
  })

  it("sets mutation errors, clears saving state and rethrows", async () => {
    const { result } = await renderReadyStore(
      "user-1",
      createSupabaseMock({ mutationError: { message: "Falha ao salvar." } }),
    )
    let caughtError: unknown = null

    await act(async () => {
      try {
        await result.current.deleteIncome("income-1")
      } catch (error) {
        caughtError = error
      }
    })

    expect(caughtError).toBeInstanceOf(Error)
    expect((caughtError as Error).message).toBe("Falha ao salvar.")
    await waitFor(() => expect(result.current.error).toBe("Falha ao salvar."))
    expect(result.current.isSaving).toBe(false)
  })

  it("marks recurring reminders as received by advancing the due date", async () => {
    const { mock, result } = await renderReadyStore(
      "user-1",
      createSupabaseMock({
        rows: {
          charge_reminders: [
            {
              amount: "100",
              created_at: "2026-01-01T00:00:00.000Z",
              frequency: "Mensal",
              id: "reminder-1",
              name: "Cobrança",
              next_due_date: "2026-01-10",
              notes: null,
              person: "Ana",
              remaining_installments: 0,
              status: "Ativo",
              total_installments: 0,
              type: "Recorrente",
            },
          ],
        },
      }),
    )

    await act(async () => {
      await result.current.markReminderReceived("reminder-1")
    })

    const update = getLastOperation(mock.operations, "charge_reminders", "update")
    expect(update.payload).toEqual({
      next_due_date: "2026-02-10",
      remaining_installments: 0,
      status: "Ativo",
    })
    expect(update.filters).toEqual([
      ["id", "reminder-1"],
      ["user_id", "user-1"],
    ])
  })

  it("ignores missing or inactive reminders when marking received", async () => {
    const { mock, result } = await renderReadyStore(
      "user-1",
      createSupabaseMock({
        rows: {
          charge_reminders: [
            {
              amount: "100",
              created_at: "2026-01-01T00:00:00.000Z",
              frequency: "Mensal",
              id: "reminder-1",
              name: "Cobrança",
              next_due_date: "2026-01-10",
              notes: null,
              person: "Ana",
              remaining_installments: 1,
              status: "Pausado",
              total_installments: 3,
              type: "Parcelado",
            },
          ],
        },
      }),
    )

    await act(async () => {
      await result.current.markReminderReceived("missing")
      await result.current.markReminderReceived("reminder-1")
    })

    expect(
      mock.operations.some(
        (operation) => operation.table === "charge_reminders" && operation.action === "update",
      ),
    ).toBe(false)
  })

  it("marks parcelled reminders as completed when the last installment is received", async () => {
    const { mock, result } = await renderReadyStore(
      "user-1",
      createSupabaseMock({
        rows: {
          charge_reminders: [
            {
              amount: "100",
              created_at: "2026-01-01T00:00:00.000Z",
              frequency: "Mensal",
              id: "reminder-1",
              name: "Cobrança",
              next_due_date: "2026-01-10",
              notes: null,
              person: "Ana",
              remaining_installments: 1,
              status: "Ativo",
              total_installments: 3,
              type: "Parcelado",
            },
          ],
        },
      }),
    )

    await act(async () => {
      await result.current.markReminderReceived("reminder-1")
    })

    expect(getLastOperation(mock.operations, "charge_reminders", "update").payload).toEqual({
      next_due_date: "2026-01-10",
      remaining_installments: 0,
      status: "Concluído",
    })
  })
})
