import { redirect } from "next/navigation"

import { getCurrentSupabaseUser } from "@/features/auth/server"

export default async function Home() {
  const user = await getCurrentSupabaseUser()

  redirect(user ? "/dashboard" : "/login")
}
