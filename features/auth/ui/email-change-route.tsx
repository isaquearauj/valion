"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmailChangeScreen } from "@/features/auth/ui/email-change-screen"
import { createSupabaseBrowser } from "@/lib/supabase/client"

export function EmailChangeRoute() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function checkSession() {
      const supabase = createSupabaseBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (isCancelled) {
        return
      }

      if (!user?.email) {
        router.replace("/login")
        return
      }

      setEmail(user.email)
      setIsReady(true)
    }

    void checkSession()

    return () => {
      isCancelled = true
    }
  }, [router])

  if (!isReady) {
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

  return <EmailChangeScreen currentEmail={email} onBack={() => router.push("/dashboard")} />
}
