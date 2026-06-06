"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { AuthScreen } from "@/components/auth/auth-screen"
import { Skeleton } from "@/components/ui/skeleton"
import { readSession, writeSession } from "@/features/auth/session"
import type { AppUser } from "@/features/finance/types"
import type { AuthMode } from "@/features/navigation/routes"
import { authPaths } from "@/features/navigation/routes"

export function AuthRouteScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isCancelled = false

    queueMicrotask(() => {
      if (isCancelled) {
        return
      }

      if (readSession()) {
        router.replace("/dashboard")
        return
      }

      setIsReady(true)
    })

    return () => {
      isCancelled = true
    }
  }, [router])

  function handleAuthenticate(user: AppUser) {
    writeSession(user)
    router.replace("/dashboard")
  }

  function handleModeChange(nextMode: AuthMode) {
    router.push(authPaths[nextMode])
  }

  if (!isReady) {
    return (
      <main className="min-h-dvh bg-background p-4 text-foreground sm:p-6">
        <div className="mx-auto flex min-h-[70dvh] max-w-7xl items-center justify-center">
          <div className="grid w-full max-w-md gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </main>
    )
  }

  return <AuthScreen mode={mode} onAuthenticate={handleAuthenticate} onModeChange={handleModeChange} />
}
