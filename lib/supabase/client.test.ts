import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({ kind: "browser-client" })),
}))

const originalEnv = process.env

describe("createSupabaseBrowser", () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  it("throws a clear error when public env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const { createSupabaseBrowser } = await import("@/lib/supabase/client")

    expect(() => createSupabaseBrowser()).toThrow("Supabase não configurado")
  })

  it("creates a browser client with public env vars", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
    const { createBrowserClient } = await import("@supabase/ssr")
    const { createSupabaseBrowser } = await import("@/lib/supabase/client")

    expect(createSupabaseBrowser()).toEqual({ kind: "browser-client" })
    expect(createBrowserClient).toHaveBeenCalledWith("https://supabase.example", "anon-key")
  })
})
