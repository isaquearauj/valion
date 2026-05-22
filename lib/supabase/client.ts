import { createBrowserClient } from "@supabase/ssr"

export function createSupabaseBrowser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase não configurado. Preencha .env.local antes de usar o cliente real.")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
