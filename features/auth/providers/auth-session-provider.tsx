"use client"

import { useRouter } from "next/navigation"
import { createContext, type ReactNode, useContext, useMemo, useState } from "react"
import { toast } from "sonner"
import { updateProfile as persistProfile } from "@/features/auth/profile-repository"
import type { AppUser, ProfileUpdate } from "@/features/auth/types"
import { createSupabaseBrowser } from "@/lib/supabase/client"

type AuthSession = {
  user: AppUser
  deleteAccount: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (update: ProfileUpdate) => Promise<void>
}

const AuthSessionContext = createContext<AuthSession | null>(null)

export function AuthSessionProvider({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser: AppUser
}) {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const [user, setUser] = useState(initialUser)

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error("Não foi possível encerrar a sessão.")
    router.replace("/login")
    router.refresh()
    toast.success("Sessão encerrada")
  }

  async function updateProfile(update: ProfileUpdate) {
    setUser(await persistProfile(supabase, user, update))
  }

  async function deleteAccount() {
    const response = await fetch("/api/account", { method: "DELETE" })
    if (!response.ok) throw new Error("Não foi possível excluir a conta.")
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
    toast.success("Conta excluída", {
      description: "Sua conta e seus dados foram removidos permanentemente.",
    })
  }

  const value = { deleteAccount, logout, updateProfile, user }

  return <AuthSessionContext value={value}>{children}</AuthSessionContext>
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext)
  if (!context) throw new Error("useAuthSession deve ser usado dentro de AuthSessionProvider.")
  return context
}
