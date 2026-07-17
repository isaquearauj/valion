"use client"

import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthSession } from "@/features/auth/providers/auth-session-provider"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { FinanceDashboard } from "@/features/finance/ui/dashboard/finance-dashboard"
import { getAppSectionFromPath, getAppSectionPath } from "@/features/navigation/routes"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação."
}

export function FinanceRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const routeSection = getAppSectionFromPath(pathname)
  const finance = useFinance()
  const auth = useAuthSession()

  if (!routeSection) return <>{children}</>

  const legacyFinance = {
    deleteExpense: finance.expenses.remove,
    deleteGoal: finance.goals.remove,
    deleteGoalContribution: finance.goals.removeContribution,
    deleteIncome: finance.incomes.remove,
    deleteInvestment: finance.investments.remove,
    deleteReminder: finance.reminders.remove,
    error: finance.error,
    isReady: finance.status === "ready",
    isSaving: finance.isPending("*"),
    markReminderReceived: finance.reminders.markReceived,
    state: finance.state,
    upsertExpense: finance.expenses.save,
    upsertGoal: finance.goals.save,
    upsertGoalContribution: finance.goals.saveContribution,
    upsertIncome: finance.incomes.save,
    upsertInvestment: finance.investments.save,
    upsertReminder: finance.reminders.save,
  }

  async function handleLogout() {
    try {
      await auth.logout()
    } catch (error) {
      toast.error("Não foi possível encerrar a sessão", { description: getErrorMessage(error) })
    }
  }

  async function handleDeleteAccount() {
    try {
      await auth.deleteAccount()
    } catch (error) {
      toast.error("Não foi possível excluir a conta", { description: getErrorMessage(error) })
      throw error
    }
  }

  if (finance.status === "loading") {
    return (
      <main className="min-h-dvh bg-background p-4 text-foreground sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4" aria-busy="true">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            {["receitas", "despesas", "saldo", "investimentos"].map((item) => (
              <Skeleton className="h-32" key={item} />
            ))}
          </div>
          <Skeleton className="h-[520px] w-full" />
        </div>
      </main>
    )
  }

  if (finance.status === "error") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground">
        <div className="max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm" role="alert">
          <h1 className="font-heading text-xl font-semibold">
            Não foi possível carregar seus dados
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Verifique sua conexão e tente novamente. Nenhuma alteração foi feita.
          </p>
          <Button className="mt-5" onClick={() => void finance.retry()}>
            Tentar novamente
          </Button>
        </div>
      </main>
    )
  }

  return (
    <FinanceDashboard
      activeSection={routeSection}
      finance={legacyFinance}
      onDeleteAccount={handleDeleteAccount}
      onLogout={handleLogout}
      onNavigateSection={(section) => router.push(getAppSectionPath(section))}
      onRequestPasswordReset={() => router.push("/alterar-senha")}
      onUpdateUser={auth.updateProfile}
      user={auth.user}
    />
  )
}
