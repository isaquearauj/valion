import type { SupabaseClient, User } from "@supabase/supabase-js"

import type { AppUser } from "@/features/finance/types"

type ProfileRow = {
  avatar_url: string | null
  created_at: string | null
  full_name: string | null
}

function getFallbackName(user: User) {
  const metadataName = user.user_metadata?.full_name

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim()
  }

  return user.email?.split("@")[0]?.replace(/[._-]/g, " ") || "Usuário"
}

export async function getAppUserFromSupabaseUser(client: SupabaseClient, user: User): Promise<AppUser> {
  const { data } = await client
    .from("profiles")
    .select("full_name, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle()
  const profile = data as ProfileRow | null

  if (!profile) {
    const fallbackName = getFallbackName(user)

    await client.from("profiles").upsert(
      {
        avatar_url: null,
        full_name: fallbackName,
        id: user.id,
      },
      { onConflict: "id" }
    )

    return {
      createdAt: user.created_at,
      email: user.email ?? "",
      id: user.id,
      name: fallbackName,
    }
  }

  return {
    avatarUrl: profile.avatar_url ?? undefined,
    createdAt: profile.created_at ?? user.created_at,
    email: user.email ?? "",
    id: user.id,
    name: profile.full_name?.trim() || getFallbackName(user),
  }
}
