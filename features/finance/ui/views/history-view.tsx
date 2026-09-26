"use client"

import { useMemo } from "react"

import { getMonthlyHistory } from "@/features/finance/domain/calculations"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { HistorySection } from "@/features/finance/ui/sections"

export function HistoryView() {
  const { state } = useFinance()
  const history = useMemo(() => getMonthlyHistory(state), [state])

  return <HistorySection history={history} />
}
