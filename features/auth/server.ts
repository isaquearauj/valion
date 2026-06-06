import { getAppUserFromSupabaseUser } from "@/features/auth/supabase-user"
import { createSupabaseServer } from "@/lib/supabase/server"

export async function getCurrentAppUser() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return getAppUserFromSupabaseUser(supabase, user)
}

export async function getCurrentSupabaseUser() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
