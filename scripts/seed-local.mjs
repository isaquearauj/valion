import { randomBytes } from "node:crypto"
import { appendFileSync, existsSync, readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import { seedDemoData } from "./seed-local-data.mjs"

if (process.env.CI) {
  console.info("Ambiente de CI detectado. Seed local ignorado.")
  process.exit(0)
}

const email = "dev@valion.local"
const envPath = new URL("../.env.local", import.meta.url)

if (!existsSync(envPath)) {
  console.info(".env.local não encontrado. Seed local ignorado.")
  process.exit(0)
}

function readLocalEnv() {
  const contents = readFileSync(envPath, "utf8")
  const values = Object.fromEntries(
    contents
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=")
        return [line.slice(0, separator), line.slice(separator + 1)]
      }),
  )
  return values
}

const env = readLocalEnv()
const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL)

if (
  url.protocol !== "http:" ||
  !["127.0.0.1", "localhost"].includes(url.hostname) ||
  url.port !== "55321"
) {
  throw new Error("O seed de desenvolvimento só pode usar o Supabase local do Valion.")
}

if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Configure as chaves locais do Supabase em .env.local antes do seed.")
}

let password = env.VALION_DEV_PASSWORD
if (!password) {
  password = `Valion-${randomBytes(18).toString("base64url")}!`
  appendFileSync(envPath, `\nVALION_DEV_PASSWORD=${password}\n`, { mode: 0o600 })
}

const options = { auth: { autoRefreshToken: false, persistSession: false } }
const admin = createClient(url.href, env.SUPABASE_SERVICE_ROLE_KEY, options)

async function findExistingUser() {
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error)
      throw new Error("Não foi possível consultar usuários no Auth local.", { cause: error })

    const found = data.users.find((user) => user.email === email)
    if (found) return found
    if (data.users.length < 1000) return null
  }
}

const existing = await findExistingUser()
if (!existing) {
  const { error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { full_name: "Conta de desenvolvimento" },
  })
  if (error)
    throw new Error("Não foi possível criar a conta de desenvolvimento local.", { cause: error })
}

const client = createClient(url.href, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
  email,
  password,
})
if (loginError || !loginData.user) {
  throw new Error(
    "A conta local existe, mas a senha em .env.local não corresponde. O seed não altera senhas de usuários existentes.",
  )
}

await seedDemoData(admin, client, loginData.user.id)

console.info(
  existing
    ? "Conta e dados demonstrativos locais confirmados."
    : "Conta e dados demonstrativos locais criados.",
)
