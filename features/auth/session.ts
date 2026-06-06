import type { AppUser } from "@/features/finance/types"

export const SESSION_STORAGE_KEY = "controle-financeiro:session:v1"

export function readSession(): AppUser | null {
  if (typeof window === "undefined") {
    return null
  }

  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY)

  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as AppUser
  } catch {
    return null
  }
}

export function writeSession(user: AppUser) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
}

export function updateSession(user: AppUser) {
  writeSession(user)
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}
