import { type NextRequest, NextResponse } from "next/server"

import { createSupabaseServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")
  const safeRedirects = new Set(["/dashboard", "/alterar-senha"])
  const redirectPath = next && safeRedirects.has(next) ? next : "/dashboard"

  if (code) {
    const supabase = await createSupabaseServer()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}
