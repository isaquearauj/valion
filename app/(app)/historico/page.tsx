import { FinanceRouteShell } from "@/components/finance/finance-route-shell"
import { getCurrentAppUser } from "@/features/auth/server"
import { redirect } from "next/navigation"

export default async function HistoricoPage() {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect("/login")
  }

  return <FinanceRouteShell initialUser={user} section="history" />
}
