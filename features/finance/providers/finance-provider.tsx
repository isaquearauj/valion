"use client"

import { createContext, type ReactNode, useContext } from "react"
import { type FinanceStore, useFinanceStore } from "@/features/finance/hooks/use-finance-store"

const FinanceContext = createContext<FinanceStore | null>(null)

export function FinanceProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const finance = useFinanceStore(userId)

  return <FinanceContext value={finance}>{children}</FinanceContext>
}

export function useFinance() {
  const context = useContext(FinanceContext)

  if (!context) {
    throw new Error("useFinance deve ser usado dentro de FinanceProvider.")
  }

  return context
}
