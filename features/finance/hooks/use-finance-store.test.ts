import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { FinanceState, Income } from "@/features/finance/domain/types"
import { useFinanceStore } from "@/features/finance/hooks/use-finance-store"

const mocks = vi.hoisted(() => ({
  listSnapshots: vi.fn(),
  loadFinanceWorkspace: vi.fn(),
  removeIncome: vi.fn(),
  saveIncome: vi.fn(),
}))

vi.mock("@/lib/supabase/client", () => ({ createSupabaseBrowser: vi.fn(() => ({ client: true })) }))
vi.mock("@/features/finance/data/repositories/workspace-repository", () => ({
  listSnapshots: mocks.listSnapshots,
  loadFinanceWorkspace: mocks.loadFinanceWorkspace,
}))
vi.mock("@/features/finance/data/repositories/income-repository", () => ({
  removeIncome: mocks.removeIncome,
  saveIncome: mocks.saveIncome,
}))
vi.mock("@/features/finance/data/repositories/expense-repository", () => ({
  removeExpense: vi.fn(),
  saveExpense: vi.fn(),
}))
vi.mock("@/features/finance/data/repositories/reminder-repository", () => ({
  receiveReminder: vi.fn(),
  removeReminder: vi.fn(),
  saveReminder: vi.fn(),
}))
vi.mock("@/features/finance/data/repositories/investment-repository", () => ({
  removeInvestment: vi.fn(),
  saveInvestment: vi.fn(),
}))
vi.mock("@/features/finance/data/repositories/goal-repository", () => ({
  removeGoal: vi.fn(),
  removeGoalContribution: vi.fn(),
  saveGoal: vi.fn(),
  saveGoalContribution: vi.fn(),
}))

function state(incomes: Income[] = []): FinanceState {
  return {
    expenses: [],
    goalContributions: [],
    goals: [],
    incomes,
    investments: [],
    reminders: [],
    snapshots: [],
  }
}

function income(id: string, name = "Salário"): Income {
  return {
    amount: 5000,
    createdAt: "2026-01-01T00:00:00Z",
    frequency: "Mensal",
    id,
    name,
    notes: "",
    receivedOn: null,
    type: "Salário",
  }
}

describe("useFinanceStore", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.loadFinanceWorkspace.mockResolvedValue(state())
    mocks.listSnapshots.mockResolvedValue([])
    mocks.removeIncome.mockResolvedValue(income("income-1"))
    mocks.saveIncome.mockResolvedValue(income("income-1"))
  })

  it("exposes loading, ready and an explicit grouped contract", async () => {
    const { result } = renderHook(() => useFinanceStore("user-1"))

    expect(result.current.status).toBe("loading")
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.incomes.save).toEqual(expect.any(Function))
    expect(result.current.retry).toEqual(expect.any(Function))
    expect(result.current.isPending("*")).toBe(false)
  })

  it("shows a generic load error and retries", async () => {
    mocks.loadFinanceWorkspace
      .mockRejectedValueOnce(new Error("private database detail"))
      .mockResolvedValueOnce(state([income("income-1")]))
    const { result } = renderHook(() => useFinanceStore("user-1"))

    await waitFor(() => expect(result.current.status).toBe("error"))
    expect(result.current.error).toBe("Não foi possível carregar seus dados financeiros.")
    expect(result.current.error).not.toContain("private")

    await act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(result.current.state.incomes).toHaveLength(1)
  })

  it("ignores a late response from the previous user", async () => {
    let resolveFirst: (value: FinanceState) => void = () => undefined
    mocks.loadFinanceWorkspace
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve
          }),
      )
      .mockResolvedValueOnce(state([income("new-user", "Nova")]))
    const { result, rerender } = renderHook(({ userId }) => useFinanceStore(userId), {
      initialProps: { userId: "user-1" },
    })

    rerender({ userId: "user-2" })
    await waitFor(() => expect(result.current.state.incomes[0]?.id).toBe("new-user"))
    await act(async () => resolveFirst(state([income("old-user", "Antiga")])))
    expect(result.current.state.incomes[0]?.id).toBe("new-user")
  })

  it("updates only income and snapshots without reloading seven resources", async () => {
    mocks.loadFinanceWorkspace.mockResolvedValue(state([income("income-1")]))
    mocks.saveIncome.mockResolvedValue(income("income-1", "Salário novo"))
    const { result } = renderHook(() => useFinanceStore("user-1"))
    await waitFor(() => expect(result.current.status).toBe("ready"))

    await act(() =>
      result.current.incomes.save(
        { ...income("ignored", "Salário novo"), createdAt: undefined, id: undefined } as never,
        "income-1",
      ),
    )

    expect(mocks.loadFinanceWorkspace).toHaveBeenCalledTimes(1)
    expect(mocks.listSnapshots).toHaveBeenCalledTimes(1)
    expect(result.current.state.incomes[0].name).toBe("Salário novo")
  })

  it("coalesces duplicate submissions with the same action key", async () => {
    let resolveSave: (value: Income) => void = () => undefined
    mocks.saveIncome.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve
        }),
    )
    const { result } = renderHook(() => useFinanceStore("user-1"))
    await waitFor(() => expect(result.current.status).toBe("ready"))
    const values = {
      amount: 100,
      frequency: "Mensal",
      name: "Extra",
      notes: "",
      receivedOn: null,
      type: "Renda extra",
    } as const

    let first!: Promise<void>
    await act(async () => {
      first = result.current.incomes.save(values)
      await result.current.incomes.save(values)
    })
    expect(mocks.saveIncome).toHaveBeenCalledTimes(1)
    expect(result.current.isPending("income:save:new")).toBe(true)
    await act(async () => {
      resolveSave(income("new", "Extra"))
      await first
    })
    expect(result.current.isPending("income:save:new")).toBe(false)
  })
})
