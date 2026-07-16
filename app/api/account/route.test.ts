import { beforeEach, describe, expect, it, vi } from "vitest"

import { DELETE } from "@/app/api/account/route"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { createSupabaseServer } from "@/lib/supabase/server"

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServer: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdmin: vi.fn(),
}))

const createSupabaseServerMock = vi.mocked(createSupabaseServer)
const createSupabaseAdminMock = vi.mocked(createSupabaseAdmin)

function serverUserResult(user: unknown, error: unknown = null) {
  createSupabaseServerMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error }),
    },
  } as never)
}

describe("account API route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 for invalid sessions", async () => {
    serverUserResult(null)

    const response = await DELETE()

    await expect(response.json()).resolves.toEqual({ error: "Sessão inválida." })
    expect(response.status).toBe(401)
    expect(createSupabaseAdminMock).not.toHaveBeenCalled()
  })

  it("deletes the authenticated user with the admin client", async () => {
    const deleteUser = vi.fn().mockResolvedValue({ error: null })
    serverUserResult({ id: "user-1" })
    createSupabaseAdminMock.mockReturnValue({ auth: { admin: { deleteUser } } } as never)

    const response = await DELETE()

    expect(deleteUser).toHaveBeenCalledWith("user-1")
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it("returns a generic error when admin deletion fails", async () => {
    const deleteUser = vi
      .fn()
      .mockResolvedValue({ error: { message: "service_role leaked sql detail" } })
    serverUserResult({ id: "user-1" })
    createSupabaseAdminMock.mockReturnValue({ auth: { admin: { deleteUser } } } as never)

    const response = await DELETE()
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload).toEqual({ error: "Não foi possível excluir a conta." })
    expect(JSON.stringify(payload)).not.toContain("service_role")
  })
})
