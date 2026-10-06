import { redirect } from "next/navigation"
import { getCurrentSupabaseUser } from "@/features/auth/server"
import { AuthRouteScreen } from "@/features/auth/ui/auth-route-screen"

export default async function RecoverPage() {
  const user = await getCurrentSupabaseUser()
  if (user) {
    redirect("/dashboard")
  }

  return <AuthRouteScreen mode="recover" />
}
