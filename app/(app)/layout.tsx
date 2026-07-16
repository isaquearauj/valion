import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { AuthSessionProvider } from "@/features/auth/providers/auth-session-provider"
import { getCurrentAppUser } from "@/features/auth/server"
import { FinanceProvider } from "@/features/finance/providers/finance-provider"
import { FinanceRouteShell } from "@/features/finance/ui/shell/finance-route-shell"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <AuthSessionProvider initialUser={user}>
      <FinanceProvider userId={user.id}>
        <FinanceRouteShell>{children}</FinanceRouteShell>
      </FinanceProvider>
    </AuthSessionProvider>
  )
}
