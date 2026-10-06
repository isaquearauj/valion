import { render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AuthLinkNotice } from "@/features/auth/ui/auth-link-notice"

const toastMock = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }))

vi.mock("sonner", () => ({ toast: toastMock }))

function setUrl(url: string) {
  window.history.replaceState(null, "", url)
}

describe("AuthLinkNotice", () => {
  afterEach(() => {
    vi.clearAllMocks()
    setUrl("/")
  })

  it("translates the partial email change confirmation and clears the hash", () => {
    setUrl(
      "/dashboard#message=Confirmation+link+accepted.+Please+proceed+to+confirm+link+sent+to+the+other+email&sb=",
    )

    render(<AuthLinkNotice />)

    expect(toastMock.success).toHaveBeenCalledWith(
      "Primeira confirmação recebida",
      expect.objectContaining({ description: expect.stringContaining("outro endereço") }),
    )
    expect(window.location.hash).toBe("")
    expect(window.location.pathname).toBe("/dashboard")
  })

  it("shows a pt-BR error for expired links without exposing the original text", () => {
    setUrl(
      "/login?x=1#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid",
    )

    render(<AuthLinkNotice />)

    expect(toastMock.error).toHaveBeenCalledWith(
      "Link expirado ou já utilizado",
      expect.any(Object),
    )
    expect(JSON.stringify(toastMock.error.mock.calls)).not.toContain("Email link is invalid")
    expect(window.location.hash).toBe("")
    expect(window.location.search).toBe("?x=1")
  })

  it("ignores unrelated hashes", () => {
    setUrl("/dashboard#secao")

    render(<AuthLinkNotice />)

    expect(toastMock.success).not.toHaveBeenCalled()
    expect(toastMock.error).not.toHaveBeenCalled()
    expect(window.location.hash).toBe("#secao")
  })
})
