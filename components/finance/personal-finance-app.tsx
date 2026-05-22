"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { AuthScreen } from "@/components/auth/auth-screen"
import { FinanceDashboard } from "@/components/finance/finance-dashboard"
import { Skeleton } from "@/components/ui/skeleton"
import type { DemoUser } from "@/features/finance/types"
import { FINANCE_STORAGE_KEY, useFinanceStore } from "@/features/finance/use-finance-store"

const SESSION_STORAGE_KEY = "controle-financeiro:session:v1"

function readSession() {
  if (typeof window === "undefined") {
    return null
  }

  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY)

  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as DemoUser
  } catch {
    return null
  }
}

export function PersonalFinanceApp() {
  const finance = useFinanceStore()
  const [user, setUser] = useState<DemoUser | null>(null)
  const [isSessionReady, setIsSessionReady] = useState(false)

  useEffect(() => {
    let isCancelled = false

    queueMicrotask(() => {
      if (isCancelled) {
        return
      }

      setUser(readSession())
      setIsSessionReady(true)
    })

    return () => {
      isCancelled = true
    }
  }, [])

  function handleAuthenticate(nextUser: DemoUser) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  function handleLogout() {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    setUser(null)
    toast.success("Sessão encerrada")
  }

  function handleDeleteAccount() {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    window.localStorage.removeItem(FINANCE_STORAGE_KEY)
    finance.clearWorkspace()
    setUser(null)
    toast.success("Conta demo excluída", {
      description: "A sessão e os dados locais foram removidos deste navegador.",
    })
  }

  if (!isSessionReady || !finance.isReady) {
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

  if (!user) {
    return <AuthScreen onAuthenticate={handleAuthenticate} />
  }

  return (
    <FinanceDashboard
      finance={finance}
      onDeleteAccount={handleDeleteAccount}
      onLogout={handleLogout}
      user={user}
    />
  )
}
