"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { PasswordResetScreen } from "@/components/auth/password-reset-screen"
import { Skeleton } from "@/components/ui/skeleton"
import { readSession } from "@/features/auth/session"
import type { AppUser } from "@/features/finance/types"

export function PasswordResetRoute() {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [user, setUser] = useState<AppUser | null>(null)

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
      setIsReady(true)
    })

    return () => {
      isCancelled = true
    }
  }, [router])

  if (!isReady || !user) {
    return (
      <main className="min-h-dvh bg-background p-4 text-foreground sm:p-6">
        <div className="mx-auto flex min-h-[70dvh] max-w-5xl items-center justify-center">
          <div className="grid w-full max-w-xl gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </main>
    )
  }

  return <PasswordResetScreen email={user.email} onBack={() => router.push("/dashboard")} />
}
