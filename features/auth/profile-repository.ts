import type { SupabaseClient } from "@supabase/supabase-js"
import type { AppUser, ProfileUpdate } from "@/features/auth/types"
import type { Database, TablesUpdate } from "@/lib/supabase/database.types"

export const AVATAR_BUCKET = "profile-avatars"
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

function getAvatarExtension(type: (typeof AVATAR_MIME_TYPES)[number]) {
  if (type === "image/jpeg") return "jpg"
  if (type === "image/png") return "png"
  return "webp"
}

export function validateAvatarFile(file: Pick<File, "size" | "type">) {
  if (!AVATAR_MIME_TYPES.includes(file.type as (typeof AVATAR_MIME_TYPES)[number])) {
    throw new Error("Selecione uma imagem JPEG, PNG ou WebP.")
  }

  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error("A imagem deve ter até 2 MB.")
  }
}

export async function updateProfile(
  client: SupabaseClient<Database>,
  user: AppUser,
  update: ProfileUpdate,
): Promise<AppUser> {
  let avatarPath = update.removeAvatar ? null : (user.avatarPath ?? null)
  let uploadedPath: string | null = null

  if (update.avatarFile) {
    validateAvatarFile(update.avatarFile)
    const type = update.avatarFile.type as (typeof AVATAR_MIME_TYPES)[number]
    uploadedPath = `${user.id}/${crypto.randomUUID()}.${getAvatarExtension(type)}`
    const upload = await client.storage
      .from(AVATAR_BUCKET)
      .upload(uploadedPath, update.avatarFile, {
        contentType: type,
        upsert: false,
      })

    if (upload.error) {
      throw new Error("Não foi possível enviar a foto de perfil.")
    }

    avatarPath = uploadedPath
  }

  const profileUpdate: TablesUpdate<"profiles"> = {
    avatar_path: avatarPath,
    avatar_url: null,
    full_name: update.name,
  }
  const { error } = await client.from("profiles").update(profileUpdate).eq("id", user.id)

  if (error) {
    if (uploadedPath) {
      await client.storage.from(AVATAR_BUCKET).remove([uploadedPath])
    }
    throw new Error("Não foi possível atualizar o perfil.")
  }

  if (user.avatarPath && user.avatarPath !== avatarPath) {
    await client.storage.from(AVATAR_BUCKET).remove([user.avatarPath])
  }

  const signed = avatarPath
    ? await client.storage.from(AVATAR_BUCKET).createSignedUrl(avatarPath, 3600)
    : null

  return {
    ...user,
    avatarPath: avatarPath ?? undefined,
    avatarUrl: signed?.data?.signedUrl,
    name: update.name,
  }
}
