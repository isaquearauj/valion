import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

type IntegrationConfig = {
  anonKey: string
  serviceRoleKey: string
  url: string
}

type SeededRow = {
  id: string
}

type SeededPair = {
  mine: SeededRow
  theirs: SeededRow
}

type FinanceTable =
  | "charge_reminders"
  | "financial_goals"
  | "fixed_expenses"
  | "goal_contributions"
  | "incomes"
  | "investment_entries"
  | "monthly_snapshots"

type TableCase = {
  name: FinanceTable
  makePayload: (userId: string, suffix: string) => Record<string, unknown>
  update: Record<string, unknown>
}

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

function getIntegrationConfig(): IntegrationConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(`Missing local Supabase env vars: ${requiredEnv.join(", ")}`)
  }

  const parsedUrl = new URL(url)
  const isLocal = parsedUrl.hostname === "127.0.0.1" || parsedUrl.hostname === "localhost"

  if (!isLocal) {
    throw new Error(
      "Supabase integration tests only run against localhost/127.0.0.1. Check NEXT_PUBLIC_SUPABASE_URL.",
    )
  }

  return { anonKey, serviceRoleKey, url }
}

function createSupabaseClient(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}

async function createConfirmedUser(admin: SupabaseClient, label: string) {
  const email = `rls-${label}-${crypto.randomUUID()}@example.test`
  const password = `Aa1!${crypto.randomUUID()}Aa1!`

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      full_name: `Usuário ${label}`,
    },
  })

  expect(error).toBeNull()
  expect(data.user).not.toBeNull()

  return { email, password, user: data.user as User }
}

async function signInAs(config: IntegrationConfig, email: string, password: string) {
  const client = createSupabaseClient(config.url, config.anonKey)
  const { error } = await client.auth.signInWithPassword({ email, password })

  expect(error).toBeNull()

  return client
}

async function insertRow(client: SupabaseClient, table: string, payload: Record<string, unknown>) {
  const { data, error } = await client.from(table).insert(payload).select("id").single()

  expect(error).toBeNull()
  expect(data).not.toBeNull()

  return data as SeededRow
}

async function expectConstraintFailure(
  client: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
) {
  const { error } = await client.from(table).insert(payload)

  expect(error).not.toBeNull()
}

function makeIncome(userId: string, suffix: string) {
  return {
    amount: 1000,
    frequency: "Mensal",
    name: `Renda ${suffix}`,
    notes: "",
    type: "Salário",
    user_id: userId,
  }
}

function makeReminder(userId: string, suffix: string) {
  return {
    amount: 100,
    frequency: "Mensal",
    name: `Cobrança ${suffix}`,
    next_due_date: "2026-09-10",
    notes: "",
    person: `Pessoa ${suffix}`,
    remaining_installments: 0,
    status: "Ativo",
    total_installments: 0,
    type: "Recorrente",
    user_id: userId,
  }
}

function makeExpense(userId: string, suffix: string) {
  return {
    category: "Contas fixas",
    due_day: 10,
    monthly_amount: 500,
    name: `Despesa ${suffix}`,
    notes: "",
    remaining_installments: 0,
    status: "Ativa",
    total_installments: 0,
    user_id: userId,
  }
}

function makeGoal(userId: string, suffix: string) {
  return {
    name: `Meta ${suffix}`,
    notes: "",
    status: "Ativa",
    target_amount: 5000,
    target_date: "2026-12-31",
    user_id: userId,
  }
}

function makeInvestment(userId: string, suffix: string) {
  const parsed = Number.parseInt(suffix, 10)
  const month = Number.isFinite(parsed) ? String(((parsed - 1) % 12) + 1).padStart(2, "0") : "01"

  return {
    invested_amount: 100,
    month: `2026-${month}-01`,
    notes: "",
    planned_amount: 200,
    user_id: userId,
  }
}

function makeSnapshot(userId: string, suffix: string) {
  const parsed = Number.parseInt(suffix, 10)
  const month = Number.isFinite(parsed) ? String(((parsed - 1) % 12) + 1).padStart(2, "0") : "01"

  return {
    expenses: 500,
    income: 1000,
    invested_amount: 100,
    month: `2027-${month}-01`,
    planned_investment: 200,
    user_id: userId,
  }
}

const config = getIntegrationConfig()

describe("Supabase RLS integration", () => {
  let admin: SupabaseClient
  let userA: Awaited<ReturnType<typeof createConfirmedUser>>
  let userB: Awaited<ReturnType<typeof createConfirmedUser>>
  let clientA: SupabaseClient

  beforeAll(async () => {
    admin = createSupabaseClient(config.url, config.serviceRoleKey)
    userA = await createConfirmedUser(admin, "a")
    userB = await createConfirmedUser(admin, "b")
    clientA = await signInAs(config, userA.email, userA.password)
  })

  afterAll(async () => {
    if (!admin || !userA || !userB) {
      return
    }

    await admin.auth.admin.deleteUser(userA.user.id)
    await admin.auth.admin.deleteUser(userB.user.id)
  })

  async function tableCases(): Promise<TableCase[]> {
    const goalA = await insertRow(admin, "financial_goals", makeGoal(userA.user.id, "contrib-a"))
    const goalB = await insertRow(admin, "financial_goals", makeGoal(userB.user.id, "contrib-b"))

    return [
      { name: "incomes", makePayload: makeIncome, update: { notes: "alterado" } },
      { name: "charge_reminders", makePayload: makeReminder, update: { notes: "alterado" } },
      { name: "fixed_expenses", makePayload: makeExpense, update: { notes: "alterado" } },
      { name: "financial_goals", makePayload: makeGoal, update: { notes: "alterado" } },
      {
        name: "goal_contributions",
        makePayload: (userId, suffix) => ({
          amount: 100,
          date: "2026-09-15",
          goal_id: userId === userA.user.id ? goalA.id : goalB.id,
          notes: `aporte ${suffix}`,
          user_id: userId,
        }),
        update: { notes: "alterado" },
      },
      { name: "investment_entries", makePayload: makeInvestment, update: { notes: "alterado" } },
    ]
  }

  async function seedPair(testCase: TableCase, index: number): Promise<SeededPair> {
    const suffixA = String(index + 1)
    const suffixB = String(index + 2)

    const mine = await insertRow(admin, testCase.name, testCase.makePayload(userA.user.id, suffixA))
    const theirs = await insertRow(
      admin,
      testCase.name,
      testCase.makePayload(userB.user.id, suffixB),
    )

    return { mine, theirs }
  }

  it("creates a profile after auth user signup", async () => {
    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name")
      .eq("id", userA.user.id)
      .single()

    expect(error).toBeNull()
    expect(data).toMatchObject({ id: userA.user.id, full_name: "Usuário a" })
  })

  it("deletes the auth user and cascades all local account data", async () => {
    const disposableUser = await createConfirmedUser(admin, "account-deletion")
    const disposableClient = await signInAs(config, disposableUser.email, disposableUser.password)
    let userDeleted = false

    try {
      await insertRow(
        disposableClient,
        "incomes",
        makeIncome(disposableUser.user.id, "account-deletion"),
      )
      await insertRow(
        disposableClient,
        "charge_reminders",
        makeReminder(disposableUser.user.id, "account-deletion"),
      )
      await insertRow(
        disposableClient,
        "fixed_expenses",
        makeExpense(disposableUser.user.id, "account-deletion"),
      )
      const goal = await insertRow(
        disposableClient,
        "financial_goals",
        makeGoal(disposableUser.user.id, "account-deletion"),
      )
      await insertRow(disposableClient, "goal_contributions", {
        amount: 100,
        date: "2026-09-15",
        goal_id: goal.id,
        notes: "account-deletion",
        user_id: disposableUser.user.id,
      })
      await insertRow(
        disposableClient,
        "investment_entries",
        makeInvestment(disposableUser.user.id, "10"),
      )
      const { error: deleteError } = await admin.auth.admin.deleteUser(disposableUser.user.id)

      expect(deleteError).toBeNull()
      userDeleted = deleteError === null

      const { data: profiles, error: profilesError } = await admin
        .from("profiles")
        .select("id")
        .eq("id", disposableUser.user.id)

      expect(profilesError).toBeNull()
      expect(profiles).toEqual([])

      const financeTables: FinanceTable[] = [
        "charge_reminders",
        "financial_goals",
        "fixed_expenses",
        "goal_contributions",
        "incomes",
        "investment_entries",
        "monthly_snapshots",
      ]

      for (const table of financeTables) {
        const { data, error } = await admin
          .from(table)
          .select("id")
          .eq("user_id", disposableUser.user.id)

        expect(error, table).toBeNull()
        expect(data, table).toEqual([])
      }
    } finally {
      if (!userDeleted) {
        await admin.auth.admin.deleteUser(disposableUser.user.id)
      }
    }
  })

  it("keeps profiles isolated to the authenticated user", async () => {
    const { data: visibleProfiles, error: selectError } = await clientA
      .from("profiles")
      .select("id")
      .in("id", [userA.user.id, userB.user.id])

    expect(selectError).toBeNull()
    expect(visibleProfiles).toEqual([{ id: userA.user.id }])

    const { data: updatedProfiles, error: updateError } = await clientA
      .from("profiles")
      .update({ full_name: "Tentativa indevida" })
      .eq("id", userB.user.id)
      .select("id")

    expect(updateError).toBeNull()
    expect(updatedProfiles).toEqual([])

    const { data: deletedProfiles, error: deleteError } = await clientA
      .from("profiles")
      .delete()
      .eq("id", userB.user.id)
      .select("id")

    expect(deleteError).toBeNull()
    expect(deletedProfiles).toEqual([])
  })

  it("prevents cross-user reads in all financial tables", async () => {
    const cases = await tableCases()

    for (const [index, testCase] of cases.entries()) {
      const pair = await seedPair(testCase, index)
      const { data, error } = await clientA
        .from(testCase.name)
        .select("id")
        .in("id", [pair.mine.id, pair.theirs.id])

      expect(error, testCase.name).toBeNull()
      expect(data, testCase.name).toEqual([{ id: pair.mine.id }])
    }
  })

  it("allows snapshot reads only for the owner and blocks direct writes", async () => {
    const mine = await insertRow(admin, "monthly_snapshots", makeSnapshot(userA.user.id, "11"))
    const theirs = await insertRow(admin, "monthly_snapshots", makeSnapshot(userB.user.id, "12"))

    const { data, error } = await clientA
      .from("monthly_snapshots")
      .select("id")
      .in("id", [mine.id, theirs.id])
    expect(error).toBeNull()
    expect(data).toEqual([{ id: mine.id }])

    const insertResult = await clientA
      .from("monthly_snapshots")
      .insert(makeSnapshot(userA.user.id, "10"))
    const updateResult = await clientA
      .from("monthly_snapshots")
      .update({ income: 9999 })
      .eq("id", mine.id)
    const deleteResult = await clientA.from("monthly_snapshots").delete().eq("id", mine.id)

    expect(insertResult.error).not.toBeNull()
    expect(updateResult.error).not.toBeNull()
    expect(deleteResult.error).not.toBeNull()
  })

  it("prevents cross-user updates and deletes in all financial tables", async () => {
    const cases = await tableCases()

    for (const [index, testCase] of cases.entries()) {
      const pair = await seedPair(testCase, index + 10)
      const { data: updatedRows, error: updateError } = await clientA
        .from(testCase.name)
        .update(testCase.update)
        .eq("id", pair.theirs.id)
        .select("id")

      expect(updateError, testCase.name).toBeNull()
      expect(updatedRows, testCase.name).toEqual([])

      const { data: deletedRows, error: deleteError } = await clientA
        .from(testCase.name)
        .delete()
        .eq("id", pair.theirs.id)
        .select("id")

      expect(deleteError, testCase.name).toBeNull()
      expect(deletedRows, testCase.name).toEqual([])

      const { data: stillExists, error: verifyError } = await admin
        .from(testCase.name)
        .select("id")
        .eq("id", pair.theirs.id)
        .single()

      expect(verifyError, testCase.name).toBeNull()
      expect(stillExists, testCase.name).toEqual({ id: pair.theirs.id })
    }
  })

  it("rejects inserts with a different user_id in all financial tables", async () => {
    const cases = await tableCases()

    for (const [index, testCase] of cases.entries()) {
      const { error } = await clientA
        .from(testCase.name)
        .insert(testCase.makePayload(userB.user.id, String(index + 20)))

      expect(error, testCase.name).not.toBeNull()
    }
  })

  it("rejects goal contributions pointing to another user's goal", async () => {
    const otherGoal = await insertRow(
      admin,
      "financial_goals",
      makeGoal(userB.user.id, "other-owner"),
    )

    await expectConstraintFailure(admin, "goal_contributions", {
      amount: 100,
      date: "2026-10-01",
      goal_id: otherGoal.id,
      notes: "",
      user_id: userA.user.id,
    })
  })

  it("enforces installment constraints for expenses and charge reminders", async () => {
    await expectConstraintFailure(admin, "fixed_expenses", {
      ...makeExpense(userA.user.id, "invalid-installments"),
      remaining_installments: 2,
      total_installments: 0,
    })

    await expectConstraintFailure(admin, "fixed_expenses", {
      ...makeExpense(userA.user.id, "too-many-installments"),
      remaining_installments: 4,
      total_installments: 3,
    })

    await expectConstraintFailure(admin, "charge_reminders", {
      ...makeReminder(userA.user.id, "recurring-with-installments"),
      remaining_installments: 1,
      total_installments: 3,
      type: "Recorrente",
    })

    await expectConstraintFailure(admin, "charge_reminders", {
      ...makeReminder(userA.user.id, "installment-without-total"),
      remaining_installments: 0,
      total_installments: 0,
      type: "Parcelado",
    })
  })

  it("rejects negative values where database constraints require positive amounts", async () => {
    await expectConstraintFailure(admin, "incomes", {
      ...makeIncome(userA.user.id, "negative"),
      amount: -1,
    })
    await expectConstraintFailure(admin, "charge_reminders", {
      ...makeReminder(userA.user.id, "negative"),
      amount: -1,
    })
    await expectConstraintFailure(admin, "fixed_expenses", {
      ...makeExpense(userA.user.id, "negative"),
      monthly_amount: -1,
    })
    await expectConstraintFailure(admin, "financial_goals", {
      ...makeGoal(userA.user.id, "negative"),
      target_amount: -1,
    })
    await expectConstraintFailure(admin, "goal_contributions", {
      amount: -1,
      date: "2026-10-01",
      goal_id: (
        await insertRow(admin, "financial_goals", makeGoal(userA.user.id, "negative-contrib"))
      ).id,
      notes: "",
      user_id: userA.user.id,
    })
    await expectConstraintFailure(admin, "investment_entries", {
      ...makeInvestment(userA.user.id, "08"),
      invested_amount: -1,
    })
  })

  it("enforces unique investment entries and monthly snapshots per user and month", async () => {
    await insertRow(admin, "investment_entries", makeInvestment(userA.user.id, "09"))
    await expectConstraintFailure(admin, "investment_entries", makeInvestment(userA.user.id, "09"))

    await insertRow(admin, "monthly_snapshots", makeSnapshot(userA.user.id, "09"))
    await expectConstraintFailure(admin, "monthly_snapshots", makeSnapshot(userA.user.id, "09"))
  })

  it("requires received_on only for one-time incomes", async () => {
    await expectConstraintFailure(admin, "incomes", {
      ...makeIncome(userA.user.id, "one-time-without-date"),
      frequency: "Única",
    })
    await expectConstraintFailure(admin, "incomes", {
      ...makeIncome(userA.user.id, "recurring-with-date"),
      received_on: "2026-01-10",
    })

    const row = await insertRow(admin, "incomes", {
      ...makeIncome(userA.user.id, "valid-one-time"),
      frequency: "Única",
      received_on: "2026-01-10",
    })
    expect(row.id).toBeTruthy()
  })

  it("ensures and isolates the current snapshot through an RPC without user_id", async () => {
    const { data, error } = await clientA.rpc("ensure_current_month_snapshot")

    expect(error).toBeNull()
    expect(data?.user_id).toBe(userA.user.id)
    expect(Object.keys(data ?? {})).not.toContain("target_user_id")

    const anonymous = createSupabaseClient(config.url, config.anonKey)
    const anonymousResult = await anonymous.rpc("ensure_current_month_snapshot")
    expect(anonymousResult.error).not.toBeNull()

    const internalHelper = await clientA.rpc("refresh_current_month_snapshot", {
      target_user_id: userA.user.id,
    })
    expect(internalHelper.error).not.toBeNull()
  })

  it("does not recalculate historical snapshots after recurring changes", async () => {
    const isolated = await createConfirmedUser(admin, "snapshot-recurring")
    const client = await signInAs(config, isolated.email, isolated.password)

    try {
      await insertRow(admin, "monthly_snapshots", {
        ...makeSnapshot(isolated.user.id, "05"),
        expenses: 650,
        income: 1750,
        month: "2025-05-01",
      })

      await insertRow(client, "incomes", makeIncome(isolated.user.id, "recurring-snapshot"))
      await insertRow(client, "fixed_expenses", makeExpense(isolated.user.id, "snapshot"))

      const { data, error } = await client
        .from("monthly_snapshots")
        .select("income,expenses")
        .eq("month", "2025-05-01")
        .single()
      expect(error).toBeNull()
      expect({ expenses: Number(data?.expenses), income: Number(data?.income) }).toEqual({
        expenses: 650,
        income: 1750,
      })
    } finally {
      await admin.auth.admin.deleteUser(isolated.user.id)
    }
  })

  it("applies historical deltas without recalculating recurring values", async () => {
    const isolated = await createConfirmedUser(admin, "snapshot-history")
    const client = await signInAs(config, isolated.email, isolated.password)
    const historicalDate = "2025-02-15"

    try {
      const { data: oneTime, error: insertError } = await client
        .from("incomes")
        .insert({
          ...makeIncome(isolated.user.id, "historical"),
          amount: 300,
          frequency: "Única",
          received_on: historicalDate,
        })
        .select("id")
        .single()
      expect(insertError).toBeNull()

      await insertRow(client, "incomes", makeIncome(isolated.user.id, "recurring-current"))
      const { data: before } = await client
        .from("monthly_snapshots")
        .select("income")
        .eq("month", "2025-02-01")
        .single()
      expect(Number(before?.income)).toBe(300)

      const { error: updateError } = await client
        .from("incomes")
        .update({ amount: 450 })
        .eq("id", oneTime?.id ?? "")
      expect(updateError).toBeNull()

      const { data: after } = await client
        .from("monthly_snapshots")
        .select("income")
        .eq("month", "2025-02-01")
        .single()
      expect(Number(after?.income)).toBe(450)

      const { error: moveError } = await client
        .from("incomes")
        .update({ received_on: "2025-03-15" })
        .eq("id", oneTime?.id ?? "")
      expect(moveError).toBeNull()

      const { data: movedSnapshots } = await client
        .from("monthly_snapshots")
        .select("month,income")
        .in("month", ["2025-02-01", "2025-03-01"])
        .order("month")
      expect(movedSnapshots?.map((snapshot) => [snapshot.month, Number(snapshot.income)])).toEqual([
        ["2025-02-01", 0],
        ["2025-03-01", 450],
      ])

      const { error: deleteError } = await client
        .from("incomes")
        .delete()
        .eq("id", oneTime?.id ?? "")
      expect(deleteError).toBeNull()

      const { data: deletedSnapshot } = await client
        .from("monthly_snapshots")
        .select("income")
        .eq("month", "2025-03-01")
        .single()
      expect(Number(deletedSnapshot?.income)).toBe(0)
    } finally {
      await admin.auth.admin.deleteUser(isolated.user.id)
    }
  })

  it("updates only investment fields in historical snapshots", async () => {
    const isolated = await createConfirmedUser(admin, "snapshot-investment")
    const client = await signInAs(config, isolated.email, isolated.password)

    try {
      await insertRow(admin, "monthly_snapshots", {
        ...makeSnapshot(isolated.user.id, "03"),
        expenses: 600,
        income: 1200,
        month: "2025-03-01",
      })
      await insertRow(admin, "monthly_snapshots", {
        ...makeSnapshot(isolated.user.id, "04"),
        expenses: 400,
        income: 900,
        month: "2025-04-01",
      })

      const { data: investment, error: insertError } = await client
        .from("investment_entries")
        .insert({
          invested_amount: 100,
          month: "2025-03-01",
          notes: "",
          planned_amount: 200,
          user_id: isolated.user.id,
        })
        .select("id")
        .single()
      expect(insertError).toBeNull()

      const { data: insertedSnapshot } = await client
        .from("monthly_snapshots")
        .select("income,expenses,planned_investment,invested_amount")
        .eq("month", "2025-03-01")
        .single()
      expect({
        expenses: Number(insertedSnapshot?.expenses),
        income: Number(insertedSnapshot?.income),
        invested: Number(insertedSnapshot?.invested_amount),
        planned: Number(insertedSnapshot?.planned_investment),
      }).toEqual({ expenses: 600, income: 1200, invested: 100, planned: 200 })

      const { error: moveError } = await client
        .from("investment_entries")
        .update({ invested_amount: 250, month: "2025-04-01", planned_amount: 300 })
        .eq("id", investment?.id ?? "")
      expect(moveError).toBeNull()

      const { data: movedSnapshots } = await client
        .from("monthly_snapshots")
        .select("month,income,expenses,planned_investment,invested_amount")
        .in("month", ["2025-03-01", "2025-04-01"])
        .order("month")
      expect(
        movedSnapshots?.map((snapshot) => ({
          expenses: Number(snapshot.expenses),
          income: Number(snapshot.income),
          invested: Number(snapshot.invested_amount),
          month: snapshot.month,
          planned: Number(snapshot.planned_investment),
        })),
      ).toEqual([
        { expenses: 600, income: 1200, invested: 0, month: "2025-03-01", planned: 0 },
        { expenses: 400, income: 900, invested: 250, month: "2025-04-01", planned: 300 },
      ])

      const { error: deleteError } = await client
        .from("investment_entries")
        .delete()
        .eq("id", investment?.id ?? "")
      expect(deleteError).toBeNull()

      const { data: deletedSnapshot } = await client
        .from("monthly_snapshots")
        .select("income,expenses,planned_investment,invested_amount")
        .eq("month", "2025-04-01")
        .single()
      expect({
        expenses: Number(deletedSnapshot?.expenses),
        income: Number(deletedSnapshot?.income),
        invested: Number(deletedSnapshot?.invested_amount),
        planned: Number(deletedSnapshot?.planned_investment),
      }).toEqual({ expenses: 400, income: 900, invested: 0, planned: 0 })
    } finally {
      await admin.auth.admin.deleteUser(isolated.user.id)
    }
  })

  it("keeps private avatars inside the authenticated user's prefix", async () => {
    const clientB = await signInAs(config, userB.email, userB.password)
    const ownPath = `${userA.user.id}/avatar.png`
    const png = new Blob([Uint8Array.from([0x89, 0x50, 0x4e, 0x47])], { type: "image/png" })

    const upload = await clientA.storage.from("profile-avatars").upload(ownPath, png)
    expect(upload.error).toBeNull()

    const crossList = await clientB.storage.from("profile-avatars").list(userA.user.id)
    expect(crossList.data).toEqual([])

    const crossUpload = await clientA.storage
      .from("profile-avatars")
      .upload(`${userB.user.id}/forbidden.png`, png)
    expect(crossUpload.error).not.toBeNull()

    const invalidMime = await clientA.storage
      .from("profile-avatars")
      .upload(`${userA.user.id}/forbidden.gif`, new Blob(["gif"], { type: "image/gif" }))
    expect(invalidMime.error).not.toBeNull()
  })

  it("updates updated_at through the database trigger", async () => {
    const { data: inserted, error: insertError } = await admin
      .from("incomes")
      .insert(makeIncome(userA.user.id, "updated-at"))
      .select("id, updated_at")
      .single()

    expect(insertError).toBeNull()
    expect(inserted).not.toBeNull()

    await new Promise((resolve) => setTimeout(resolve, 25))

    const { data: updated, error: updateError } = await admin
      .from("incomes")
      .update({ notes: "trigger atualizado" })
      .eq("id", (inserted as { id: string }).id)
      .select("updated_at")
      .single()

    expect(updateError).toBeNull()
    expect(new Date((updated as { updated_at: string }).updated_at).getTime()).toBeGreaterThan(
      new Date((inserted as { updated_at: string }).updated_at).getTime(),
    )
  })
})
