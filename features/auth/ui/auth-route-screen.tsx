"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AuthScreen } from "@/features/auth/ui/auth-screen"
import type { AuthMode } from "@/features/navigation/routes"
import { authPaths } from "@/features/navigation/routes"
import { createSupabaseBrowser } from "@/lib/supabase/client"

export function AuthRouteScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function checkSession() {
      if (isCancelled) {
        return
      }

      const supabase = createSupabaseBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.replace("/dashboard")
        return
      }

      setIsReady(true)
    }

    void checkSession()

    return () => {
      isCancelled = true
    }
  }, [router])

  function handleAuthenticate() {
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

  return (
    <AuthScreen mode={mode} onAuthenticate={handleAuthenticate} onModeChange={handleModeChange} />
  )
}
