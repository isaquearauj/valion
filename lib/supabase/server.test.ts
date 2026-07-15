import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const cookieStore = {
  getAll: vi.fn(() => [{ name: "session", value: "abc" }]),
  set: vi.fn(),
}

type CookieAdapter = {
  cookies: {
    getAll: () => unknown
    setAll: (cookies: Array<{ name: string; options?: object; value: string }>) => void
  }
}

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}))

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ kind: "server-client" })),
}))

const originalEnv = process.env

describe("createSupabaseServer", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("throws a clear error when public env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const { createSupabaseServer } = await import("@/lib/supabase/server")

    await expect(createSupabaseServer()).rejects.toThrow("Supabase não configurado")
  })

  it("creates a server client with cookie adapters", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
    const { createServerClient } = await import("@supabase/ssr")
    const { createSupabaseServer } = await import("@/lib/supabase/server")

    await expect(createSupabaseServer()).resolves.toEqual({ kind: "server-client" })

    const options = vi.mocked(createServerClient).mock.calls[0]?.[2] as CookieAdapter
    expect(createServerClient).toHaveBeenCalledWith("https://supabase.example", "anon-key", expect.any(Object))
    expect(options.cookies.getAll()).toEqual([{ name: "session", value: "abc" }])

    options.cookies.setAll([{ name: "next", value: "123", options: { httpOnly: true } }])
    expect(cookieStore.set).toHaveBeenCalledWith("next", "123", { httpOnly: true })
  })

  it("ignores cookie write failures from Server Components", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
    cookieStore.set.mockImplementationOnce(() => {
      throw new Error("readonly cookies")
    })
    const { createServerClient } = await import("@supabase/ssr")
    const { createSupabaseServer } = await import("@/lib/supabase/server")

    await createSupabaseServer()

    const options = vi.mocked(createServerClient).mock.calls[0]?.[2] as CookieAdapter
    expect(() => options.cookies.setAll([{ name: "next", value: "123" }])).not.toThrow()
  })
})
