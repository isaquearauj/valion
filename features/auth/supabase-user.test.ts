import type { User } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"
import { getAppUserFromSupabaseUser } from "@/features/auth/supabase-user"

type Profile = {
  avatar_path: string | null
  avatar_url: string | null
  created_at: string | null
  full_name: string | null
} | null

function user(overrides: Partial<User> = {}): User {
  return {
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    email: "ana.silva@example.com",
    id: "user-1",
    user_metadata: {},
    ...overrides,
  } as User
}

function clientWithProfile(profile: Profile) {
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const maybeSingle = vi.fn().mockResolvedValue({ data: profile })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const createSignedUrl = vi
    .fn()
    .mockResolvedValue({ data: { signedUrl: "https://signed.test/avatar" }, error: null })
  const from = vi.fn().mockReturnValue({ select, upsert })

  return {
    client: { from, storage: { from: vi.fn(() => ({ createSignedUrl })) } },
    createSignedUrl,
    select,
    upsert,
  }
}

describe("getAppUserFromSupabaseUser", () => {
  it("generates a signed URL for a private avatar path", async () => {
    const mock = clientWithProfile({
      avatar_path: "user-1/avatar.webp",
      avatar_url: null,
      created_at: "2026-01-02T00:00:00.000Z",
      full_name: " Ana Silva ",
    })

    await expect(getAppUserFromSupabaseUser(mock.client as never, user())).resolves.toEqual({
      avatarPath: "user-1/avatar.webp",
      avatarUrl: "https://signed.test/avatar",
      createdAt: "2026-01-02T00:00:00.000Z",
      email: "ana.silva@example.com",
      id: "user-1",
      name: "Ana Silva",
    })
    expect(mock.select).toHaveBeenCalledWith("full_name,avatar_url,avatar_path,created_at")
    expect(mock.createSignedUrl).toHaveBeenCalledWith("user-1/avatar.webp", 3600)
  })

  it("creates a missing profile with metadata fallback name", async () => {
    const mock = clientWithProfile(null)

    await expect(
      getAppUserFromSupabaseUser(
        mock.client as never,
        user({ user_metadata: { full_name: "  Maria Souza  " } }),
      ),
    ).resolves.toMatchObject({ name: "Maria Souza" })
    expect(mock.upsert).toHaveBeenCalledWith(
      { avatar_path: null, avatar_url: null, full_name: "Maria Souza", id: "user-1" },
      { onConflict: "id" },
    )
  })

  it("falls back to email and user creation date", async () => {
    const mock = clientWithProfile({
      avatar_path: null,
      avatar_url: null,
      created_at: null,
      full_name: "   ",
    })

    await expect(getAppUserFromSupabaseUser(mock.client as never, user())).resolves.toEqual({
      avatarPath: undefined,
      avatarUrl: undefined,
      createdAt: "2026-01-01T00:00:00.000Z",
      email: "ana.silva@example.com",
      id: "user-1",
      name: "ana silva",
    })
  })
})
