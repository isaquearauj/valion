import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { createSupabaseServer } from "@/lib/supabase/server"

function hasValidOrigin(request: Request) {
  const origin = request.headers.get("origin")

  if (!origin) return false

  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

async function removeUserAvatars(userId: string) {
  const admin = createSupabaseAdmin()
  const bucket = admin.storage.from("profile-avatars")
  async function listPrefix(prefix: string): Promise<string[]> {
    const paths: string[] = []
    let offset = 0

    while (true) {
      const { data, error } = await bucket.list(prefix, { limit: 1000, offset })

      if (error) throw new Error("avatar cleanup failed")

      for (const object of data ?? []) {
        const path = `${prefix}/${object.name}`

        if (object.id) paths.push(path)
        else paths.push(...(await listPrefix(path)))
      }

      if ((data?.length ?? 0) < 1000) break
      offset += 1000
    }

    return paths
  }

  const paths = await listPrefix(userId)

  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await bucket.remove(paths.slice(index, index + 100))
    if (error) throw new Error("avatar cleanup failed")
  }

  return admin
}

export async function DELETE(request: Request) {
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: "Não foi possível excluir a conta." }, { status: 403 })
  }

  const supabase = await createSupabaseServer()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 })
  }

  let admin: ReturnType<typeof createSupabaseAdmin>

  try {
    admin = await removeUserAvatars(user.id)
  } catch {
    return NextResponse.json({ error: "Não foi possível excluir a conta." }, { status: 500 })
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: "Não foi possível excluir a conta." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
