import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ kind: "admin-client" })),
}))

const originalEnv = process.env

describe("createSupabaseAdmin", () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  it("throws a clear error when admin env vars are missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example"
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const { createSupabaseAdmin } = await import("@/lib/supabase/admin")

    expect(() => createSupabaseAdmin()).toThrow("Supabase admin não configurado")
  })

  it("creates an admin client with service-role-only auth settings", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key"
    const { createClient } = await import("@supabase/supabase-js")
    const { createSupabaseAdmin } = await import("@/lib/supabase/admin")

    expect(createSupabaseAdmin()).toEqual({ kind: "admin-client" })
    expect(createClient).toHaveBeenCalledWith("https://supabase.example", "service-role-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  })
})
