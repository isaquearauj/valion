"use client"

import { useRouter } from "next/navigation"
import { useMemo } from "react"
import {
  calculateFinanceSummary,
  getExpenseDistribution,
  getMonthlyHistory,
} from "@/features/finance/domain/calculations"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { OverviewSection } from "@/features/finance/ui/dashboard/overview-section"
import { getAppSectionPath } from "@/features/navigation/routes"

export function DashboardRoute() {
  const finance = useFinance()
  const router = useRouter()
  const summary = useMemo(() => calculateFinanceSummary(finance.state), [finance.state])
  const history = useMemo(() => getMonthlyHistory(finance.state), [finance.state])
  const distribution = useMemo(() => getExpenseDistribution(finance.state), [finance.state])

  return (
    <OverviewSection
      distribution={distribution}
      history={history}
      onNavigateSection={(section) => router.push(getAppSectionPath(section))}
      summary={summary}
    />
  )
}
