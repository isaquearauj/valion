"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle({
  size = "default",
}: {
  size?: "default" | "small"
}) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    let isCancelled = false

    queueMicrotask(() => {
      if (!isCancelled) {
        setMounted(true)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [])

  if (!mounted) {
    return (
      <Button
        aria-label="Alternar tema"
        disabled
        size={size === "small" ? "icon-sm" : "icon"}
        variant="outline"
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      size={size === "small" ? "icon-sm" : "icon"}
      variant="outline"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
