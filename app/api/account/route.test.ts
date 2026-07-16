import { beforeEach, describe, expect, it, vi } from "vitest"
import { DELETE } from "@/app/api/account/route"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { createSupabaseServer } from "@/lib/supabase/server"

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServer: vi.fn() }))
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdmin: vi.fn() }))

const createSupabaseServerMock = vi.mocked(createSupabaseServer)
const createSupabaseAdminMock = vi.mocked(createSupabaseAdmin)

function request(origin = "https://valionapp.com") {
  return new Request("https://valionapp.com/api/account", {
    headers: origin ? { origin } : undefined,
    method: "DELETE",
  })
}

function serverUserResult(user: unknown, error: unknown = null) {
  createSupabaseServerMock.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error }) },
  } as never)
}

function adminClient({
  deleteError = null,
  listError = null,
  removeError = null,
}: {
  deleteError?: unknown
  listError?: unknown
  removeError?: unknown
} = {}) {
  const deleteUser = vi.fn().mockResolvedValue({ error: deleteError })
  const list = vi.fn().mockResolvedValue({
    data: listError ? null : [{ id: "object-1", name: "avatar.webp" }],
    error: listError,
  })
  const remove = vi.fn().mockResolvedValue({ error: removeError })
  createSupabaseAdminMock.mockReturnValue({
    auth: { admin: { deleteUser } },
    storage: { from: vi.fn(() => ({ list, remove })) },
  } as never)
  return { deleteUser, list, remove }
}

describe("account API route", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects DELETE requests from another origin before reading the session", async () => {
    const response = await DELETE(request("https://evil.example"))

    expect(response.status).toBe(403)
    expect(createSupabaseServerMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ error: "Não foi possível excluir a conta." })
  })

  it("rejects missing or malformed origins before reading the session", async () => {
    const missingOrigin = await DELETE(request(""))
    const malformedOrigin = await DELETE(request("not a URL"))

    expect(missingOrigin.status).toBe(403)
    expect(malformedOrigin.status).toBe(403)
    expect(createSupabaseServerMock).not.toHaveBeenCalled()
  })

  it("returns 401 for invalid sessions", async () => {
    serverUserResult(null)

    const response = await DELETE(request())

    expect(response.status).toBe(401)
    expect(createSupabaseAdminMock).not.toHaveBeenCalled()
  })

  it("removes avatar objects before deleting the authenticated user", async () => {
    serverUserResult({ id: "user-1" })
    const { deleteUser, remove } = adminClient()

    const response = await DELETE(request())

    expect(remove).toHaveBeenCalledWith(["user-1/avatar.webp"])
    expect(remove.mock.invocationCallOrder[0]).toBeLessThan(deleteUser.mock.invocationCallOrder[0])
    expect(deleteUser).toHaveBeenCalledWith("user-1")
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it("does not delete Auth when Storage cleanup fails", async () => {
    serverUserResult({ id: "user-1" })
    const { deleteUser } = adminClient({ listError: { message: "private detail" } })

    const response = await DELETE(request())

    expect(response.status).toBe(500)
    expect(deleteUser).not.toHaveBeenCalled()
    expect(JSON.stringify(await response.json())).not.toContain("private detail")
  })

  it("does not delete Auth when removing an avatar fails", async () => {
    serverUserResult({ id: "user-1" })
    const { deleteUser } = adminClient({ removeError: { message: "private detail" } })

    const response = await DELETE(request())

    expect(response.status).toBe(500)
    expect(deleteUser).not.toHaveBeenCalled()
    expect(JSON.stringify(await response.json())).not.toContain("private detail")
  })

  it("returns a generic error when Auth deletion fails", async () => {
    serverUserResult({ id: "user-1" })
    adminClient({ deleteError: { message: "service role detail" } })

    const response = await DELETE(request())
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload).toEqual({ error: "Não foi possível excluir a conta." })
    expect(JSON.stringify(payload)).not.toContain("service role")
  })
})
