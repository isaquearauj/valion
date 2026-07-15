import { NextResponse } from "next/server"

import { createSupabaseServer } from "@/lib/supabase/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

export async function DELETE() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 })
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: "Não foi possível excluir a conta." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
