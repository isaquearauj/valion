"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { readSession } from "@/features/auth/session"

export function RootRedirect() {
  const router = useRouter()

  useEffect(() => {
    const session = readSession()
    router.replace(session ? "/dashboard" : "/login")
  }, [router])

  return null
}
