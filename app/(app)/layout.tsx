import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { FinanceRouteShell } from "@/features/finance/ui/shell/finance-route-shell"
import { getCurrentAppUser } from "@/features/auth/server"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect("/login")
  }

  return <FinanceRouteShell initialUser={user}>{children}</FinanceRouteShell>
}
