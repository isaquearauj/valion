"use client"

import { Edit3Icon, PlusIcon, Trash2Icon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Progress } from "@/components/ui/progress"
import type { Goal, GoalContribution } from "@/features/finance/domain/types"
import {
  getGoalProgress,
  normalizeGoalFormValues,
} from "@/features/finance/presentation/dashboard-view-models"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { GoalContributionDialog, GoalDialog } from "@/features/finance/ui/routes/goals-dialogs"
import { GoalStatusBadge, SectionHeader } from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatDateKey } from "@/lib/formatters"

type DeleteTarget = { id: string; kind: "contribution" | "goal"; label: string }

export function GoalsRoute() {
  const finance = useFinance()
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editingContribution, setEditingContribution] = useState<GoalContribution | null>(null)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const selectedGoal =
    finance.state.goals.find((goal) => goal.id === selectedGoalId) ?? finance.state.goals[0] ?? null
  const contributions = useMemo(
    () =>
      finance.state.goalContributions
        .filter((item) => item.goalId === selectedGoal?.id)
        .toSorted((a, b) => b.date.localeCompare(a.date)),
    [finance.state.goalContributions, selectedGoal?.id],
  )

  function openGoal(goal: Goal | null) {
    setEditingGoal(goal)
    if (goal) setSelectedGoalId(goal.id)
    setGoalDialogOpen(true)
  }

  function openContribution(contribution: GoalContribution | null) {
    if (!selectedGoal) return
    setEditingContribution(contribution)
    setContributionDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.kind === "goal") await finance.goals.remove(deleteTarget.id)
    else await finance.goals.removeContribution(deleteTarget.id)
    toast.success(deleteTarget.kind === "goal" ? "Meta excluída" : "Aporte removido")
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Crie objetivos, registre aportes e acompanhe quanto falta para concluí-los."
        title="Metas financeiras"
      />
      <div>
        <Button onClick={() => openGoal(null)}>
          <PlusIcon data-icon="inline-start" /> Nova meta
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Suas metas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {finance.state.goals.length ? (
              finance.state.goals.map((goal) => {
                const progress = getGoalProgress(
                  goal,
                  finance.state.goalContributions.filter((item) => item.goalId === goal.id),
                )
                return (
                  <button
                    className="rounded-2xl border p-4 text-left transition hover:bg-muted/60"
                    key={goal.id}
                    onClick={() => setSelectedGoalId(goal.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{goal.name}</span>
                      <GoalStatusBadge status={goal.status} />
                    </div>
                    <Progress className="mt-3" value={progress.percent} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatCurrency(progress.currentAmount)} de{" "}
                      {formatCurrency(goal.targetAmount)}
                    </p>
                  </button>
                )
              })
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma meta criada.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{selectedGoal?.name ?? "Detalhes da meta"}</CardTitle>
              {selectedGoal ? (
                <div className="flex gap-2">
                  <Button onClick={() => openGoal(selectedGoal)} size="sm" variant="outline">
                    <Edit3Icon data-icon="inline-start" /> Editar
                  </Button>
                  <Button
                    onClick={() =>
                      setDeleteTarget({
                        id: selectedGoal.id,
                        kind: "goal",
                        label: selectedGoal.name,
                      })
                    }
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2Icon data-icon="inline-start" /> Excluir
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {selectedGoal ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Aportes registrados</p>
                  <Button onClick={() => openContribution(null)} size="sm">
                    <PlusIcon data-icon="inline-start" /> Novo aporte
                  </Button>
                </div>
                <div className="space-y-2">
                  {contributions.length ? (
                    contributions.map((contribution) => (
                      <div
                        className="flex items-center justify-between gap-3 rounded-xl border p-3"
                        key={contribution.id}
                      >
                        <div>
                          <p className="font-mono font-medium">
                            {formatCurrency(contribution.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateKey(contribution.date)}
                          </p>
                        </div>
                        <div>
                          <Button
                            aria-label="Editar aporte"
                            onClick={() => openContribution(contribution)}
                            size="icon-sm"
                            variant="ghost"
                          >
                            <Edit3Icon />
                          </Button>
                          <Button
                            aria-label="Excluir aporte"
                            onClick={() =>
                              setDeleteTarget({
                                id: contribution.id,
                                kind: "contribution",
                                label: "este aporte",
                              })
                            }
                            size="icon-sm"
                            variant="ghost"
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum aporte registrado.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Crie uma meta para começar.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      {goalDialogOpen ? (
        <GoalDialog
          goal={editingGoal}
          onOpenChange={setGoalDialogOpen}
          onSubmit={async (values) => {
            const currentAmount = editingGoal
              ? getGoalProgress(
                  editingGoal,
                  finance.state.goalContributions.filter((item) => item.goalId === editingGoal.id),
                ).currentAmount
              : 0
            await finance.goals.save(
              normalizeGoalFormValues(values, currentAmount),
              editingGoal?.id,
            )
            toast.success(editingGoal ? "Meta atualizada" : "Meta criada")
          }}
          open={goalDialogOpen}
        />
      ) : null}
      {contributionDialogOpen && selectedGoal ? (
        <GoalContributionDialog
          contribution={editingContribution}
          defaultGoalId={selectedGoal.id}
          goals={finance.state.goals}
          onOpenChange={setContributionDialogOpen}
          onSubmit={async (values, id) => {
            await finance.goals.saveContribution(values, id)
            toast.success(id ? "Aporte atualizado" : "Aporte registrado")
          }}
          open={contributionDialogOpen}
        />
      ) : null}
      <ConfirmDialog
        description={
          deleteTarget?.kind === "goal"
            ? `A meta “${deleteTarget.label}” e seus aportes serão removidos.`
            : "O aporte será removido permanentemente."
        }
        isPending={
          deleteTarget
            ? finance.isPending(
                `${deleteTarget.kind === "goal" ? "goal" : "contribution"}:remove:${deleteTarget.id}`,
              )
            : false
        }
        onConfirm={confirmDelete}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        open={Boolean(deleteTarget)}
        title={deleteTarget?.kind === "goal" ? "Excluir meta?" : "Excluir aporte?"}
      />
    </div>
  )
}
