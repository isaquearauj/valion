import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET } from "@/app/auth/callback/route"
import { createSupabaseServer } from "@/lib/supabase/server"

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServer: vi.fn(),
}))

const createSupabaseServerMock = vi.mocked(createSupabaseServer)

function request(url: string) {
  return new Request(url) as never
}

describe("auth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("exchanges code for session and redirects to allowed dashboard path", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    createSupabaseServerMock.mockResolvedValue({ auth: { exchangeCodeForSession } } as never)

    const response = await GET(
      request("https://valionapp.com/auth/callback?code=abc&next=/dashboard"),
    )

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc")
    expect(response.headers.get("location")).toBe("https://valionapp.com/dashboard")
  })

  it("allows the password reset path", async () => {
    const response = await GET(request("https://valionapp.com/auth/callback?next=/alterar-senha"))

    expect(createSupabaseServerMock).not.toHaveBeenCalled()
    expect(response.headers.get("location")).toBe("https://valionapp.com/alterar-senha")
  })

  it("rejects external and unknown redirects", async () => {
    await expect(
      GET(request("https://valionapp.com/auth/callback?next=https://evil.example/phish")),
    ).resolves.toMatchObject({ status: 307 })
    expect(
      (
        await GET(request("https://valionapp.com/auth/callback?next=https://evil.example/phish"))
      ).headers.get("location"),
    ).toBe("https://valionapp.com/dashboard")
    expect(
      (await GET(request("https://valionapp.com/auth/callback?next=/admin"))).headers.get(
        "location",
      ),
    ).toBe("https://valionapp.com/dashboard")
  })
})
