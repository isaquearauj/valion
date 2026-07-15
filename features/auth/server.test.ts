import { beforeEach, describe, expect, it, vi } from "vitest"

import { getCurrentAppUser, getCurrentSupabaseUser } from "@/features/auth/server"
import { getAppUserFromSupabaseUser } from "@/features/auth/supabase-user"
import { createSupabaseServer } from "@/lib/supabase/server"

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServer: vi.fn(),
}))

vi.mock("@/features/auth/supabase-user", () => ({
  getAppUserFromSupabaseUser: vi.fn(),
}))

const createSupabaseServerMock = vi.mocked(createSupabaseServer)
const getAppUserFromSupabaseUserMock = vi.mocked(getAppUserFromSupabaseUser)

function supabaseWithUser(user: unknown) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  }
}

describe("auth server helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns null when there is no current app user", async () => {
    createSupabaseServerMock.mockResolvedValue(supabaseWithUser(null) as never)

    await expect(getCurrentAppUser()).resolves.toBeNull()
    expect(getAppUserFromSupabaseUserMock).not.toHaveBeenCalled()
  })

  it("maps the Supabase user to the app user", async () => {
    const supabase = supabaseWithUser({ id: "user-1" })
    const appUser = { createdAt: "2026-01-01", email: "a@b.com", id: "user-1", name: "Ana" }
    createSupabaseServerMock.mockResolvedValue(supabase as never)
    getAppUserFromSupabaseUserMock.mockResolvedValue(appUser)

    await expect(getCurrentAppUser()).resolves.toBe(appUser)
    expect(getAppUserFromSupabaseUserMock).toHaveBeenCalledWith(supabase, { id: "user-1" })
  })

  it("returns the raw current Supabase user", async () => {
    const rawUser = { id: "user-1" }
    createSupabaseServerMock.mockResolvedValue(supabaseWithUser(rawUser) as never)

    await expect(getCurrentSupabaseUser()).resolves.toBe(rawUser)
  })
})
