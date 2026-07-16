import { describe, expect, it, vi } from "vitest"
import { migrateLegacyAvatar, parseLegacyAvatar } from "@/features/auth/avatar-migration"

const validPng = `data:image/png;base64,${Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]).toString("base64")}`

function client() {
  const updateEq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn(() => ({ eq: updateEq }))
  const upload = vi.fn().mockResolvedValue({ error: null })
  const remove = vi.fn().mockResolvedValue({ error: null })
  return {
    client: {
      from: vi.fn(() => ({ update })),
      storage: { from: vi.fn(() => ({ remove, upload })) },
    },
    remove,
    update,
    upload,
  }
}

describe("legacy avatar migration", () => {
  it("accepts only allowed base64 images with matching signatures", () => {
    expect(parseLegacyAvatar(validPng)).toMatchObject({ extension: "png", mimeType: "image/png" })
    expect(parseLegacyAvatar("data:image/svg+xml;base64,PHN2Zz4=")).toBeNull()
    expect(parseLegacyAvatar("data:image/png;base64,aW52YWxpZA==")).toBeNull()
    expect(parseLegacyAvatar("https://example.com/avatar.png")).toBeNull()
  })

  it("uploads valid legacy data once and clears avatar_url", async () => {
    const mock = client()
    const path = await migrateLegacyAvatar(mock.client as never, "user-1", validPng)

    expect(path).toMatch(/^user-1\/.+\.png$/)
    expect(mock.upload).toHaveBeenCalledTimes(1)
    expect(mock.update).toHaveBeenCalledWith({ avatar_path: path, avatar_url: null })
  })

  it("clears invalid legacy values without uploading content", async () => {
    const mock = client()

    await expect(
      migrateLegacyAvatar(mock.client as never, "user-1", "data:image/png;base64,aW52YWxpZA=="),
    ).resolves.toBeNull()
    expect(mock.upload).not.toHaveBeenCalled()
    expect(mock.update).toHaveBeenCalledWith({ avatar_url: null })
  })
})
