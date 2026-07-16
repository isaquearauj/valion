import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const getUser = vi.fn().mockResolvedValue({ data: { user: null } })

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser } })),
}))

const originalEnv = process.env

type CookieAdapter = {
  cookies: {
    getAll: () => unknown
    setAll: (cookies: Array<{ name: string; options?: object; value: string }>) => void
  }
}

function request() {
  const requestCookies = new Map<string, string>()

  return {
    cookies: {
      getAll: vi.fn(() => Array.from(requestCookies, ([name, value]) => ({ name, value }))),
      set: vi.fn((name: string, value: string) => {
        requestCookies.set(name, value)
      }),
    },
  }
}

describe("proxy", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("returns next response without Supabase when env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const { createServerClient } = await import("@supabase/ssr")
    const { proxy } = await import("@/proxy")

    const response = await proxy(request() as never)

    expect(response).toBeInstanceOf(Response)
    expect(createServerClient).not.toHaveBeenCalled()
    expect(getUser).not.toHaveBeenCalled()
  })

  it("creates Supabase server client, refreshes user and propagates cookies", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
    const { createServerClient } = await import("@supabase/ssr")
    const { proxy } = await import("@/proxy")
    const fakeRequest = request()

    const response = await proxy(fakeRequest as never)
    const options = vi.mocked(createServerClient).mock.calls[0]?.[2] as unknown as CookieAdapter

    expect(createServerClient).toHaveBeenCalledWith(
      "https://supabase.example",
      "anon-key",
      expect.any(Object),
    )
    expect(getUser).toHaveBeenCalled()
    expect(options.cookies.getAll()).toEqual([])
    options.cookies.setAll([
      { name: "sb-session", value: "abc", options: { path: "/", httpOnly: true } },
    ])
    expect(fakeRequest.cookies.set).toHaveBeenCalledWith("sb-session", "abc")
    expect(response).toBeInstanceOf(Response)
  })

  it("keeps matcher scoped to authenticated and account routes", async () => {
    const { config } = await import("@/proxy")

    expect(config.matcher).toEqual([
      "/",
      "/dashboard",
      "/receitas",
      "/despesas",
      "/investimentos",
      "/metas",
      "/historico",
      "/alterar-senha",
      "/api/account",
    ])
  })
})
