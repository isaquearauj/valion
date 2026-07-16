import { describe, expect, it, vi } from "vitest"
import { removeIncome, saveIncome } from "@/features/finance/data/repositories/income-repository"
import type { IncomeRow } from "@/features/finance/data/supabase-mappers"

const row: IncomeRow = {
  amount: 500,
  created_at: "2026-01-01T00:00:00Z",
  frequency: "Mensal",
  id: "income-1",
  name: "Salário",
  notes: "",
  received_on: null,
  type: "Salário",
  updated_at: "2026-01-01T00:00:00Z",
  user_id: "user-1",
}

function client(
  result: { data: IncomeRow | null; error: { message: string } | null } = {
    data: row,
    error: null,
  },
) {
  const operations: Array<{
    action: string
    payload?: unknown
    filters: Array<[string, unknown]>
  }> = []
  const operation = {
    action: "select",
    filters: [] as Array<[string, unknown]>,
    payload: undefined as unknown,
  }
  operations.push(operation)
  const builder = {
    delete() {
      operation.action = "delete"
      return this
    },
    eq(column: string, value: unknown) {
      operation.filters.push([column, value])
      return this
    },
    insert(payload: unknown) {
      operation.action = "insert"
      operation.payload = payload
      return this
    },
    select() {
      return this
    },
    single: vi.fn().mockResolvedValue(result),
    update(payload: unknown) {
      operation.action = "update"
      operation.payload = payload
      return this
    },
  }
  return { client: { from: vi.fn(() => builder) }, operation }
}

const recurring = {
  amount: 500,
  frequency: "Mensal",
  name: "Salário",
  notes: "",
  receivedOn: null,
  type: "Salário",
} as const

describe("income repository", () => {
  it("inserts recurring income with a null received_on", async () => {
    const mock = client()

    await saveIncome(mock.client as never, "user-1", recurring)

    expect(mock.operation.action).toBe("insert")
    expect(mock.operation.payload).toMatchObject({ received_on: null, user_id: "user-1" })
  })

  it("persists the received date for one-time income", async () => {
    const mock = client({
      data: { ...row, frequency: "Única", received_on: "2026-02-15" },
      error: null,
    })

    const saved = await saveIncome(mock.client as never, "user-1", {
      ...recurring,
      frequency: "Única",
      receivedOn: "2026-02-15",
    })

    expect(mock.operation.payload).toMatchObject({ received_on: "2026-02-15" })
    expect(saved.receivedOn).toBe("2026-02-15")
  })

  it("scopes updates by both id and user_id", async () => {
    const mock = client()

    await saveIncome(mock.client as never, "user-1", recurring, "income-1")

    expect(mock.operation.action).toBe("update")
    expect(mock.operation.filters).toEqual([
      ["id", "income-1"],
      ["user_id", "user-1"],
    ])
  })

  it("returns a generic delete error without leaking database details", async () => {
    const mock = client({ data: null, error: { message: "private SQL detail" } } as never)

    await expect(removeIncome(mock.client as never, "user-1", "income-1")).rejects.toThrow(
      "Não foi possível excluir a receita.",
    )
  })
})
