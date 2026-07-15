import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

const demoEmail = "valion-demo@example.test"
const demoPassword = "ValionDemo123!"
const demoName = "Usuário Demo"

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const separator = trimmed.indexOf("=")

    if (separator <= 0) {
      continue
    }

    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function createSupabaseClient(url, key) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}

async function assertSupabaseSuccess(operation, result) {
  if (result.error) {
    throw new Error(`${operation}: ${result.error.message}`)
  }

  return result.data
}

loadEnvFile(resolve(process.cwd(), ".env.local"))
loadEnvFile(resolve(process.cwd(), ".env"))

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

assert(url && anonKey && serviceRoleKey, "Configure as variáveis locais do Supabase antes de executar o seed.")

const parsedUrl = new URL(url)
assert(
  parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1",
  "O seed local só pode ser executado contra localhost ou 127.0.0.1."
)

const admin = createSupabaseClient(url, serviceRoleKey)
const anonymous = createSupabaseClient(url, anonKey)
const users = await assertSupabaseSuccess(
  "listar usuários locais",
  await admin.auth.admin.listUsers({ perPage: 1000 })
)
let demoUser = users.users.find((user) => user.email === demoEmail)

if (!demoUser) {
  demoUser = await assertSupabaseSuccess(
    "criar usuário demo",
    await admin.auth.admin.createUser({
      email: demoEmail,
      email_confirm: true,
      password: demoPassword,
      user_metadata: { full_name: demoName },
    })
  )
} else {
  demoUser = await assertSupabaseSuccess(
    "atualizar usuário demo",
    await admin.auth.admin.updateUserById(demoUser.id, {
      email_confirm: true,
      password: demoPassword,
      user_metadata: { full_name: demoName },
    })
  )
}

const signedIn = await assertSupabaseSuccess(
  "autenticar usuário demo",
  await anonymous.auth.signInWithPassword({ email: demoEmail, password: demoPassword })
)
assert(signedIn.user, "O Supabase não retornou o usuário demo autenticado.")

await assertSupabaseSuccess(
  "salvar perfil demo",
  await anonymous.from("profiles").upsert(
    {
      avatar_url: null,
      full_name: demoName,
      id: signedIn.user.id,
    },
    { onConflict: "id" }
  )
)

const rows = {
  incomes: [
    {
      amount: 6500,
      frequency: "Mensal",
      id: "00000000-0000-4000-8000-000000000001",
      name: "Salário principal",
      notes: "Dado demonstrativo local",
      type: "Salário",
      user_id: signedIn.user.id,
    },
    {
      amount: 900,
      frequency: "Mensal",
      id: "00000000-0000-4000-8000-000000000002",
      name: "Freelance mensal",
      notes: "Dado demonstrativo local",
      type: "Freelance",
      user_id: signedIn.user.id,
    },
  ],
  charge_reminders: [
    {
      amount: 450,
      frequency: "Mensal",
      id: "00000000-0000-4000-8000-000000000003",
      name: "Reembolso de viagem",
      next_due_date: "2026-07-20",
      notes: "Dado demonstrativo local",
      person: "Cliente demo",
      remaining_installments: 2,
      status: "Ativo",
      total_installments: 3,
      type: "Parcelado",
      user_id: signedIn.user.id,
    },
  ],
  fixed_expenses: [
    {
      category: "Contas fixas",
      due_day: 10,
      id: "00000000-0000-4000-8000-000000000004",
      monthly_amount: 1800,
      name: "Moradia",
      notes: "Dado demonstrativo local",
      remaining_installments: 0,
      status: "Ativa",
      total_installments: 0,
      user_id: signedIn.user.id,
    },
    {
      category: "Assinaturas",
      due_day: 15,
      id: "00000000-0000-4000-8000-000000000005",
      monthly_amount: 180,
      name: "Assinaturas digitais",
      notes: "Dado demonstrativo local",
      remaining_installments: 0,
      status: "Ativa",
      total_installments: 0,
      user_id: signedIn.user.id,
    },
  ],
  financial_goals: [
    {
      id: "00000000-0000-4000-8000-000000000006",
      name: "Reserva de emergência",
      notes: "Dado demonstrativo local",
      status: "Ativa",
      target_amount: 12000,
      target_date: "2026-12-31",
      user_id: signedIn.user.id,
    },
  ],
  goal_contributions: [
    {
      amount: 2400,
      date: "2026-07-05",
      goal_id: "00000000-0000-4000-8000-000000000006",
      id: "00000000-0000-4000-8000-000000000007",
      notes: "Dado demonstrativo local",
      user_id: signedIn.user.id,
    },
  ],
  investment_entries: [
    {
      id: "00000000-0000-4000-8000-000000000008",
      invested_amount: 700,
      month: "2026-07-01",
      notes: "Dado demonstrativo local",
      planned_amount: 1000,
      user_id: signedIn.user.id,
    },
  ],
  monthly_snapshots: [
    {
      expenses: 1800,
      id: "00000000-0000-4000-8000-000000000009",
      income: 6500,
      invested_amount: 700,
      month: "2026-06-01",
      planned_investment: 900,
      user_id: signedIn.user.id,
    },
  ],
}

for (const [table, values] of Object.entries(rows)) {
  await assertSupabaseSuccess(
    `salvar dados demo em ${table}`,
    await anonymous.from(table).upsert(values, { onConflict: "id" })
  )
}

console.log("Seed local concluído.")
