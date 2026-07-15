import type { SupabaseClient, User } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"

import { getAppUserFromSupabaseUser } from "@/features/auth/supabase-user"

type Profile = {
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
  const from = vi.fn().mockReturnValue({ select, upsert })

  return {
    client: { from } as unknown as SupabaseClient,
    eq,
    from,
    maybeSingle,
    select,
    upsert,
  }
}

describe("getAppUserFromSupabaseUser", () => {
  it("returns an app user from an existing profile", async () => {
    const { client, eq, from, select, upsert } = clientWithProfile({
      avatar_url: "https://example.com/avatar.png",
      created_at: "2026-01-02T00:00:00.000Z",
      full_name: " Ana Silva ",
    })

    await expect(getAppUserFromSupabaseUser(client, user())).resolves.toEqual({
      avatarUrl: "https://example.com/avatar.png",
      createdAt: "2026-01-02T00:00:00.000Z",
      email: "ana.silva@example.com",
      id: "user-1",
      name: "Ana Silva",
    })
    expect(from).toHaveBeenCalledWith("profiles")
    expect(select).toHaveBeenCalledWith("full_name, avatar_url, created_at")
    expect(eq).toHaveBeenCalledWith("id", "user-1")
    expect(upsert).not.toHaveBeenCalled()
  })

  it("creates a missing profile with metadata fallback name", async () => {
    const { client, upsert } = clientWithProfile(null)

    await expect(
      getAppUserFromSupabaseUser(
        client,
        user({ user_metadata: { full_name: "  Maria Souza  " } })
      )
    ).resolves.toMatchObject({ name: "Maria Souza" })
    expect(upsert).toHaveBeenCalledWith(
      {
        avatar_url: null,
        full_name: "Maria Souza",
        id: "user-1",
      },
      { onConflict: "id" }
    )
  })

  it("falls back to email and then to a generic user name", async () => {
    const emailClient = clientWithProfile(null)
    const noEmailClient = clientWithProfile(null)

    await expect(
      getAppUserFromSupabaseUser(emailClient.client, user({ email: "joao-pedro.dev@example.com" }))
    ).resolves.toMatchObject({ email: "joao-pedro.dev@example.com", name: "joao pedro dev" })
    await expect(
      getAppUserFromSupabaseUser(noEmailClient.client, user({ email: undefined }))
    ).resolves.toMatchObject({ email: "", name: "Usuário" })
  })

  it("uses fallback name and user creation date when profile values are blank", async () => {
    const { client } = clientWithProfile({
      avatar_url: null,
      created_at: null,
      full_name: "   ",
    })

    await expect(getAppUserFromSupabaseUser(client, user())).resolves.toEqual({
      avatarUrl: undefined,
      createdAt: "2026-01-01T00:00:00.000Z",
      email: "ana.silva@example.com",
      id: "user-1",
      name: "ana silva",
    })
  })
})
