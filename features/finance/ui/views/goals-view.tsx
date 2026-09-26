"use client"

import { useFinance } from "@/features/finance/providers/finance-provider"
import { GoalsSection } from "@/features/finance/ui/sections"

export function GoalsView() {
  const { state, goals } = useFinance()

  return (
    <GoalsSection
      contributions={state.goalContributions}
      goals={state.goals}
      onDeleteContribution={goals.removeContribution}
      onDeleteGoal={goals.remove}
      onUpsertContribution={goals.saveContribution}
      onUpsertGoal={goals.save}
    />
  )
}
