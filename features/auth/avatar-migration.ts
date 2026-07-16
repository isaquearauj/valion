import type { SupabaseClient } from "@supabase/supabase-js"
import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  type AVATAR_MIME_TYPES,
} from "@/features/auth/profile-repository"
import type { Database } from "@/lib/supabase/database.types"

type LegacyAvatar = {
  bytes: Uint8Array
  extension: "jpg" | "png" | "webp"
  mimeType: (typeof AVATAR_MIME_TYPES)[number]
}

function hasExpectedSignature(bytes: Uint8Array, mimeType: LegacyAvatar["mimeType"]) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }

  if (mimeType === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    )
  }

  return (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
}

export function parseLegacyAvatar(value: string): LegacyAvatar | null {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)

  if (!match) return null

  const mimeType = match[1] as LegacyAvatar["mimeType"]
  let decoded: string

  try {
    decoded = atob(match[2])
  } catch {
    return null
  }

  const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0))

  if (
    bytes.byteLength === 0 ||
    bytes.byteLength > AVATAR_MAX_BYTES ||
    !hasExpectedSignature(bytes, mimeType)
  ) {
    return null
  }

  return {
    bytes,
    extension: mimeType === "image/jpeg" ? "jpg" : (mimeType.split("/")[1] as "png" | "webp"),
    mimeType,
  }
}

export async function migrateLegacyAvatar(
  client: SupabaseClient<Database>,
  userId: string,
  avatarUrl: string | null,
) {
  if (!avatarUrl) return null

  const legacy = parseLegacyAvatar(avatarUrl)

  if (!legacy) {
    await client.from("profiles").update({ avatar_url: null }).eq("id", userId)
    return null
  }

  const path = `${userId}/${crypto.randomUUID()}.${legacy.extension}`
  const upload = await client.storage.from(AVATAR_BUCKET).upload(path, legacy.bytes, {
    contentType: legacy.mimeType,
    upsert: false,
  })

  if (upload.error) return null

  const profileUpdate = await client
    .from("profiles")
    .update({ avatar_path: path, avatar_url: null })
    .eq("id", userId)

  if (profileUpdate.error) {
    await client.storage.from(AVATAR_BUCKET).remove([path])
    return null
  }

  return path
}
