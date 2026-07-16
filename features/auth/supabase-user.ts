import type { SupabaseClient, User } from "@supabase/supabase-js"
import { migrateLegacyAvatar } from "@/features/auth/avatar-migration"
import { AVATAR_BUCKET } from "@/features/auth/profile-repository"
import type { AppUser } from "@/features/auth/types"
import type { Database } from "@/lib/supabase/database.types"

function getFallbackName(user: User) {
  const metadataName = user.user_metadata?.full_name

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim()
  }

  return user.email?.split("@")[0]?.replace(/[._-]/g, " ") || "Usuário"
}

export async function getAppUserFromSupabaseUser(
  client: SupabaseClient<Database>,
  user: User,
): Promise<AppUser> {
  const { data: profile } = await client
    .from("profiles")
    .select("full_name,avatar_url,avatar_path,created_at")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    const fallbackName = getFallbackName(user)

    await client.from("profiles").upsert(
      {
        avatar_path: null,
        avatar_url: null,
        full_name: fallbackName,
        id: user.id,
      },
      { onConflict: "id" },
    )

    return {
      createdAt: user.created_at,
      email: user.email ?? "",
      id: user.id,
      name: fallbackName,
    }
  }

  const avatarPath =
    profile.avatar_path ?? (await migrateLegacyAvatar(client, user.id, profile.avatar_url))
  const signedAvatar = avatarPath
    ? await client.storage.from(AVATAR_BUCKET).createSignedUrl(avatarPath, 3600)
    : null

  return {
    avatarPath: avatarPath ?? undefined,
    avatarUrl: signedAvatar?.data?.signedUrl,
    createdAt: profile.created_at ?? user.created_at,
    email: user.email ?? "",
    id: user.id,
    name: profile.full_name?.trim() || getFallbackName(user),
  }
}
