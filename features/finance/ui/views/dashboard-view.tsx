"use client"

import { useRouter } from "next/navigation"
import { useMemo } from "react"

import {
  calculateFinanceSummary,
  getExpenseDistribution,
  getMonthlyHistory,
} from "@/features/finance/domain/calculations"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { OverviewSection } from "@/features/finance/ui/sections"
import { getAppSectionPath } from "@/features/navigation/routes"

export function DashboardView() {
  const router = useRouter()
  const { state } = useFinance()

  const summary = useMemo(() => calculateFinanceSummary(state), [state])
  const history = useMemo(() => getMonthlyHistory(state), [state])
  const distribution = useMemo(() => getExpenseDistribution(state), [state])

  return (
    <OverviewSection
      distribution={distribution}
      history={history}
      onNavigateSection={(section) => router.push(getAppSectionPath(section))}
      summary={summary}
    />
  )
}
