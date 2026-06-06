"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FinanceDashboard } from "@/components/finance/finance-dashboard"
import { Skeleton } from "@/components/ui/skeleton"
import { clearSession, readSession, updateSession } from "@/features/auth/session"
import type { AppUser } from "@/features/finance/types"
import { useFinanceStore } from "@/features/finance/use-finance-store"
import type { AppSection } from "@/features/navigation/routes"
import { getAppSectionPath } from "@/features/navigation/routes"

export function FinanceRouteShell({ section }: { section: AppSection }) {
  const router = useRouter()
  const finance = useFinanceStore()
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [user, setUser] = useState(readSession())

  useEffect(() => {
    let isCancelled = false

    queueMicrotask(() => {
      if (isCancelled) {
        return
      }

      const session = readSession()

      if (!session) {
        router.replace("/login")
        return
      }

      setUser(session)
      setIsSessionReady(true)
    })

    return () => {
      isCancelled = true
    }
  }, [router])

  function handleLogout() {
    clearSession()
    setUser(null)
    router.replace("/login")
    toast.success("Sessão encerrada")
  }

  function handleUpdateUser(nextUser: AppUser) {
    updateSession(nextUser)
    setUser(nextUser)
  }

  function handleRequestPasswordReset() {
    router.push("/alterar-senha")
  }

  function handleDeleteAccount() {
    clearSession()
    finance.clearWorkspace()
    setUser(null)
    router.replace("/login")
    toast.success("Conta excluída", {
      description: "A sessão e os dados da conta foram removidos.",
    })
  }

  if (!isSessionReady || !finance.isReady || !user) {
    return (
      <main className="min-h-dvh bg-background p-4 text-foreground sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-[520px] w-full" />
        </div>
      </main>
    )
  }

  return (
    <FinanceDashboard
      activeSection={section}
      finance={finance}
      onDeleteAccount={handleDeleteAccount}
      onLogout={handleLogout}
      onRequestPasswordReset={handleRequestPasswordReset}
      onUpdateUser={handleUpdateUser}
      onNavigateSection={(nextSection) => {
        router.push(getAppSectionPath(nextSection))
      }}
      user={user}
    />
  )
}
