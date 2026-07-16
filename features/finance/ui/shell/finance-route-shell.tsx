"use client"

import { usePathname, useRouter } from "next/navigation"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import type { AppUser } from "@/features/auth/types"
import { useFinanceStore } from "@/features/finance/hooks/use-finance-store"
import { FinanceDashboard } from "@/features/finance/ui/dashboard/finance-dashboard"
import type { AppSection } from "@/features/navigation/routes"
import { getAppSectionFromPath, getAppSectionPath } from "@/features/navigation/routes"
import { createSupabaseBrowser } from "@/lib/supabase/client"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação."
}

export function FinanceRouteShell({
  children,
  initialUser,
}: {
  children?: ReactNode
  initialUser: AppUser
}) {
  const pathname = usePathname()
  const routeSection = getAppSectionFromPath(pathname)
  const [activeSection, setActiveSection] = useState<AppSection>(routeSection ?? "dashboard")

  useEffect(() => {
    function handlePopState() {
      const nextSection = getAppSectionFromPath(window.location.pathname)

      if (nextSection) {
        setActiveSection(nextSection)
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  if (!routeSection) {
    return <>{children}</>
  }

  return (
    <FinanceWorkspaceShell
      activeSection={activeSection}
      initialUser={initialUser}
      onActiveSectionChange={setActiveSection}
    />
  )
}

function FinanceWorkspaceShell({
  activeSection,
  initialUser,
  onActiveSectionChange,
}: {
  activeSection: AppSection
  initialUser: AppUser
  onActiveSectionChange: (section: AppSection) => void
}) {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const [user, setUser] = useState(initialUser)
  const finance = useFinanceStore(user.id)

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.error("Não foi possível encerrar a sessão", {
        description: error.message,
      })
      return
    }

    router.replace("/login")
    router.refresh()
    toast.success("Sessão encerrada")
  }

  async function handleUpdateUser(nextUser: AppUser) {
    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: nextUser.avatarUrl ?? null,
        full_name: nextUser.name,
      })
      .eq("id", user.id)

    if (error) {
      throw new Error(error.message)
    }

    setUser(nextUser)
  }

  function handleRequestPasswordReset() {
    router.push("/alterar-senha")
  }

  async function handleDeleteAccount() {
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? "Não foi possível excluir a conta.")
      }

      await supabase.auth.signOut()
      router.replace("/login")
      router.refresh()
      toast.success("Conta excluída", {
        description: "Sua conta e seus dados foram removidos permanentemente.",
      })
    } catch (error) {
      toast.error("Não foi possível excluir a conta", {
        description: getErrorMessage(error),
      })
    }
  }

  function handleNavigateSection(nextSection: AppSection) {
    const path = getAppSectionPath(nextSection)

    onActiveSectionChange(nextSection)

    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path)
    }
  }

  if (!finance.isReady) {
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
      activeSection={activeSection}
      finance={finance}
      onDeleteAccount={handleDeleteAccount}
      onLogout={handleLogout}
      onRequestPasswordReset={handleRequestPasswordReset}
      onUpdateUser={handleUpdateUser}
      onNavigateSection={handleNavigateSection}
      user={user}
    />
  )
}
