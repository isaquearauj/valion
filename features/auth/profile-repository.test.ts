import { describe, expect, it, vi } from "vitest"
import { updateProfile, validateAvatarFile } from "@/features/auth/profile-repository"

const user = {
  avatarPath: "user-1/old.png",
  avatarUrl: "https://signed/old",
  createdAt: "2026-01-01T00:00:00Z",
  email: "ana@example.com",
  id: "user-1",
  name: "Ana",
}

function client({
  profileError = null,
  uploadError = null,
}: {
  profileError?: unknown
  uploadError?: unknown
} = {}) {
  const eq = vi.fn().mockResolvedValue({ error: profileError })
  const update = vi.fn(() => ({ eq }))
  const upload = vi.fn().mockResolvedValue({ error: uploadError })
  const remove = vi.fn().mockResolvedValue({ error: null })
  const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed/new" } })
  return {
    client: {
      from: vi.fn(() => ({ update })),
      storage: { from: vi.fn(() => ({ createSignedUrl, remove, upload })) },
    },
    createSignedUrl,
    remove,
    update,
    upload,
  }
}

describe("profile repository", () => {
  it("accepts JPEG, PNG and WebP within 2 MB", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(() => validateAvatarFile({ size: 100, type })).not.toThrow()
    }
  })

  it("rejects unsupported formats and oversized files", () => {
    expect(() => validateAvatarFile({ size: 100, type: "image/gif" })).toThrow("JPEG, PNG ou WebP")
    expect(() => validateAvatarFile({ size: 2 * 1024 * 1024 + 1, type: "image/png" })).toThrow(
      "até 2 MB",
    )
  })

  it("uploads a new private avatar, persists only its path and removes the old object", async () => {
    const mock = client()
    const file = new File(["png"], "avatar.png", { type: "image/png" })
    const result = await updateProfile(mock.client as never, user, {
      avatarFile: file,
      name: "Ana Silva",
      removeAvatar: false,
    })

    expect(mock.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-1\/.+\.png$/),
      file,
      expect.objectContaining({ contentType: "image/png" }),
    )
    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({ avatar_url: null, full_name: "Ana Silva" }),
    )
    expect(mock.remove).toHaveBeenCalledWith(["user-1/old.png"])
    expect(result).toMatchObject({ avatarUrl: "https://signed/new", name: "Ana Silva" })
  })

  it("removes an existing avatar and falls back without signing a URL", async () => {
    const mock = client()
    const result = await updateProfile(mock.client as never, user, {
      name: "Ana",
      removeAvatar: true,
    })

    expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ avatar_path: null }))
    expect(mock.createSignedUrl).not.toHaveBeenCalled()
    expect(result.avatarUrl).toBeUndefined()
  })

  it("does not update the profile when upload fails", async () => {
    const mock = client({ uploadError: { message: "storage detail" } })
    const file = new File(["png"], "avatar.png", { type: "image/png" })

    await expect(
      updateProfile(mock.client as never, user, {
        avatarFile: file,
        name: "Ana",
        removeAvatar: false,
      }),
    ).rejects.toThrow("enviar a foto")
    expect(mock.update).not.toHaveBeenCalled()
  })

  it("rolls back a newly uploaded object when the profile update fails", async () => {
    const mock = client({ profileError: { message: "database detail" } })
    const file = new File(["png"], "avatar.png", { type: "image/png" })

    await expect(
      updateProfile(mock.client as never, user, {
        avatarFile: file,
        name: "Ana",
        removeAvatar: false,
      }),
    ).rejects.toThrow("atualizar o perfil")
    expect(mock.remove).toHaveBeenCalledWith([expect.stringMatching(/^user-1\//)])
  })
})
