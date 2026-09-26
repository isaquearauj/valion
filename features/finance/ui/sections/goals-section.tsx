"use client"

import { Edit3Icon, PlusIcon, TargetIcon, Trash2Icon } from "lucide-react"
import { useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Goal, GoalContribution } from "@/features/finance/domain/types"
import {
  calculateGoalsSummary,
  formatGoalDeadline,
  formatShortCurrency,
  getGoalProgress,
  getGoalTimeline,
  isGoalCompleted,
  normalizeGoalFormValues,
  sortGoals,
} from "@/features/finance/presentation/dashboard-view-models"
import { goalChartConfig } from "@/features/finance/ui/dashboard/chart-config"
import { GoalTooltip } from "@/features/finance/ui/dashboard/overview-section"
import { GoalContributionDialog, GoalDialog } from "@/features/finance/ui/dialogs"
import { ChartLegendItem } from "@/features/finance/ui/sections/section-helpers"
import {
  GoalStatusBadge,
  getActionErrorMessage,
  MetricCard,
  ResponsiveTable,
  SectionHeader,
} from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatDateKeyLong, formatPercent } from "@/lib/formatters"
import { cn } from "@/lib/utils"

export type GoalsSectionProps = {
  goals: Goal[]
  contributions: GoalContribution[]
  onDeleteGoal: (id: string) => Promise<void>
  onDeleteContribution: (id: string) => Promise<void>
  onUpsertGoal: (values: Omit<Goal, "createdAt" | "id">, id?: string) => Promise<void>
  onUpsertContribution: (
    values: Omit<GoalContribution, "createdAt" | "id">,
    id?: string,
  ) => Promise<void>
}

export function GoalsSection({
  contributions,
  goals: initialGoals,
  onDeleteContribution,
  onDeleteGoal,
  onUpsertContribution,
  onUpsertGoal,
}: GoalsSectionProps) {
  const goals = useMemo(() => sortGoals(initialGoals, contributions), [contributions, initialGoals])
  const [selectedGoalId, setSelectedGoalId] = useState<string>("")
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editingContribution, setEditingContribution] = useState<GoalContribution | null>(null)

  const selectedGoal = useMemo(() => {
    return goals.find((goal) => goal.id === selectedGoalId) ?? goals[0] ?? null
  }, [goals, selectedGoalId])

  const selectedGoalContributions = useMemo(() => {
    if (!selectedGoal) {
      return []
    }

    return contributions
      .filter((contribution) => contribution.goalId === selectedGoal.id)
      .toSorted((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
  }, [contributions, selectedGoal])

  const goalsSummary = useMemo(
    () => calculateGoalsSummary(goals, contributions),
    [contributions, goals],
  )
  const selectedGoalProgress = useMemo(
    () => (selectedGoal ? getGoalProgress(selectedGoal, selectedGoalContributions) : null),
    [selectedGoal, selectedGoalContributions],
  )
  const selectedGoalCompleted = Boolean(selectedGoalProgress && selectedGoalProgress.percent >= 100)
  const selectedGoalTimeline = useMemo(
    () => (selectedGoal ? getGoalTimeline(selectedGoal, selectedGoalContributions) : []),
    [selectedGoal, selectedGoalContributions],
  )
  const chartMaxValue = selectedGoal
    ? Math.max(selectedGoal.targetAmount, selectedGoalTimeline.at(-1)?.cumulativeAmount ?? 0, 1000)
    : 1000
  const goalDeadlineLabel = selectedGoal ? formatGoalDeadline(selectedGoal) : "Sem prazo"

  function openCreateGoal() {
    setEditingGoal(null)
    setIsGoalDialogOpen(true)
  }

  function openEditGoal(goal: Goal) {
    setEditingGoal(goal)
    setSelectedGoalId(goal.id)
    setIsGoalDialogOpen(true)
  }

  function openContributionDialog(goalId?: string) {
    const nextGoalId = goalId ?? selectedGoal?.id ?? goals[0]?.id

    if (!nextGoalId) {
      return
    }

    setEditingContribution(null)
    setSelectedGoalId(nextGoalId)
    setIsContributionDialogOpen(true)
  }

  function openEditContribution(contribution: GoalContribution) {
    setEditingContribution(contribution)
    setSelectedGoalId(contribution.goalId)
    setIsContributionDialogOpen(true)
  }

  async function runGoalAction(action: () => Promise<void>, successMessage: string) {
    try {
      await action()
      toast.success(successMessage)
    } catch (error) {
      toast.error("Não foi possível salvar", {
        description: getActionErrorMessage(error),
      })
      throw error
    }
  }

  async function handleDeleteGoal(goal: Goal) {
    if (
      !window.confirm(`Excluir a meta ${goal.name}? Os aportes vinculados também serão removidos.`)
    ) {
      return
    }

    try {
      await onDeleteGoal(goal.id)
      toast.success("Meta excluída")
    } catch (error) {
      toast.error("Não foi possível excluir a meta", {
        description: getActionErrorMessage(error),
      })
    }
  }

  async function handleDeleteContribution(contribution: GoalContribution) {
    if (!window.confirm("Excluir este aporte?")) {
      return
    }

    try {
      await onDeleteContribution(contribution.id)
      toast.success("Aporte removido")
    } catch (error) {
      toast.error("Não foi possível excluir o aporte", {
        description: getActionErrorMessage(error),
      })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Crie objetivos financeiros, registre aportes e acompanhe a evolução até a conclusão."
        title="Metas financeiras"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Metas ativas" value={String(goalsSummary.activeGoals)} />
        <MetricCard label="Valor alvo total" value={formatCurrency(goalsSummary.totalTarget)} />
        <MetricCard label="Valor aportado" value={formatCurrency(goalsSummary.totalContributed)} />
        <MetricCard label="Taxa de conclusão" value={formatPercent(goalsSummary.completionRate)} />
      </div>

      {!goals.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <TargetIcon className="size-10 text-muted-foreground" />
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-semibold">Nenhuma meta criada ainda</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Registre objetivos como um MacBook, uma reserva de emergência ou uma viagem e
                acompanhe o progresso por aportes.
              </p>
            </div>
            <Button onClick={openCreateGoal}>Criar primeira meta</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-foreground/10 bg-card/90 py-0 shadow-xl shadow-primary/5">
            <CardHeader className="bg-card px-5 py-5 sm:px-6 lg:px-8 lg:py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Meta em foco</Badge>
                    {selectedGoalCompleted ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                        Concluída
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="mt-3 text-2xl">
                    {selectedGoal?.name ?? "Selecione uma meta"}
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-2xl">
                    {selectedGoal
                      ? `${goalDeadlineLabel} · ${formatCurrency(
                          selectedGoalProgress?.currentAmount ?? 0,
                        )} acumulados de ${formatCurrency(selectedGoal.targetAmount)}`
                      : "Escolha uma meta para acompanhar o progresso e os aportes vinculados."}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="border-sky-500/30 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 focus-visible:ring-sky-500/30 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20"
                    onClick={() => openContributionDialog(selectedGoal?.id)}
                    variant="outline"
                  >
                    <PlusIcon data-icon="inline-start" />
                    Registrar aporte
                  </Button>
                  <Button
                    onClick={openCreateGoal}
                    className="border-violet-500/30 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 focus-visible:ring-violet-500/30 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/20"
                    variant="outline"
                  >
                    <PlusIcon data-icon="inline-start" />
                    Criar meta
                  </Button>
                  <Button
                    onClick={() => selectedGoal && openEditGoal(selectedGoal)}
                    variant="outline"
                  >
                    <Edit3Icon data-icon="inline-start" />
                    Editar meta
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-5 sm:p-6 lg:p-8">
              <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                {goals.map((goal) => (
                  <button
                    aria-pressed={goal.id === selectedGoal?.id}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      goal.id === selectedGoal?.id &&
                        "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
                    )}
                    key={goal.id}
                    onClick={() => setSelectedGoalId(goal.id)}
                    type="button"
                  >
                    {goal.name}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="bg-background/80 shadow-sm">
                  <CardHeader>
                    <CardTitle>Evolução dos aportes</CardTitle>
                    <CardDescription>
                      Acompanhe quanto já foi acumulado até atingir o valor da meta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-hidden">
                    {selectedGoalTimeline.length ? (
                      <ChartContainer className="h-[320px] w-full" config={goalChartConfig}>
                        <LineChart
                          accessibilityLayer
                          data={selectedGoalTimeline}
                          margin={{ left: 24, right: 16, top: 12 }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis
                            axisLine={false}
                            dataKey="label"
                            tickLine={false}
                            tickMargin={10}
                          />
                          <YAxis
                            axisLine={false}
                            domain={[0, chartMaxValue + 1000]}
                            tickFormatter={(value) => formatShortCurrency(Number(value))}
                            tickLine={false}
                            width={64}
                          />
                          <ChartTooltip content={<GoalTooltip />} />
                          <ReferenceLine
                            ifOverflow="extendDomain"
                            label="Meta"
                            stroke="var(--color-targetAmount)"
                            strokeDasharray="6 6"
                            y={selectedGoal.targetAmount}
                          />
                          <Line
                            dataKey="cumulativeAmount"
                            dot={false}
                            stroke="var(--color-cumulativeAmount)"
                            strokeWidth={2.5}
                            type="monotone"
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 text-center">
                        <TargetIcon className="size-10 text-muted-foreground" />
                        <div className="space-y-2">
                          <p className="font-medium">Sem aportes registrados</p>
                          <p className="text-sm leading-6 text-muted-foreground">
                            Use o botão de aporte para começar a visualizar a evolução da meta.
                          </p>
                        </div>
                        <Button onClick={() => openContributionDialog(selectedGoal?.id)}>
                          Registrar primeiro aporte
                        </Button>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
                      <ChartLegendItem color="var(--chart-3)" label="Acumulado" />
                      <ChartLegendItem color="var(--chart-4)" label="Meta" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/80 shadow-sm">
                  <CardHeader>
                    <CardTitle>Detalhes da meta</CardTitle>
                    <CardDescription>
                      Resumo rápido com prazo, saldo restante e status atual.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {selectedGoal && selectedGoalProgress ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <GoalStatusBadge
                            completed={selectedGoalCompleted}
                            status={selectedGoal.status}
                          />
                          <span className="font-mono text-sm tabular-nums text-muted-foreground">
                            {selectedGoalProgress.percent.toFixed(1)}% concluído
                          </span>
                        </div>

                        <Progress value={selectedGoalProgress.percent} />

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border bg-muted/20 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Acumulado
                            </p>
                            <p className="mt-2 font-mono text-xl font-semibold tabular-nums">
                              {formatCurrency(selectedGoalProgress.currentAmount)}
                            </p>
                          </div>
                          <div className="rounded-xl border bg-muted/20 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Falta atingir
                            </p>
                            <p className="mt-2 font-mono text-xl font-semibold tabular-nums">
                              {formatCurrency(selectedGoalProgress.remainingAmount)}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide">Prazo</p>
                            <p className="mt-1 font-medium text-foreground">{goalDeadlineLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide">Aportes</p>
                            <p className="mt-1 font-medium text-foreground">
                              {selectedGoalContributions.length} registro(s)
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                        Selecione uma meta para ver seus detalhes.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-background/80 shadow-sm">
                <CardHeader>
                  <CardTitle>Aportes da meta selecionada</CardTitle>
                  <CardDescription>
                    Registros recentes usados para compor a evolução acumulada.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedGoalContributions.length ? (
                    <ResponsiveTable>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedGoalContributions
                            .toSorted((a, b) => b.date.localeCompare(a.date))
                            .map((contribution) => (
                              <TableRow key={contribution.id}>
                                <TableCell>{formatDateKeyLong(contribution.date)}</TableCell>
                                <TableCell className="text-right font-mono tabular-nums">
                                  {formatCurrency(contribution.amount)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      aria-label="Editar aporte"
                                      onClick={() => openEditContribution(contribution)}
                                      size="icon-sm"
                                      variant="ghost"
                                    >
                                      <Edit3Icon />
                                    </Button>
                                    <Button
                                      aria-label="Excluir aporte"
                                      onClick={() => handleDeleteContribution(contribution)}
                                      size="icon-sm"
                                      variant="ghost"
                                    >
                                      <Trash2Icon className="text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </ResponsiveTable>
                  ) : (
                    <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                      Nenhum aporte registrado para esta meta.
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Todas as metas</CardTitle>
              <CardDescription>
                Visão consolidada com valor alvo, valor acumulado e status de cada objetivo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meta</TableHead>
                      <TableHead className="text-right">Alvo</TableHead>
                      <TableHead className="text-right">Acumulado</TableHead>
                      <TableHead className="text-right">Restante</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goals.map((goal) => {
                      const progress = getGoalProgress(
                        goal,
                        contributions.filter((item) => item.goalId === goal.id),
                      )
                      const completed = progress.percent >= 100

                      return (
                        <TableRow
                          className={cn(goal.id === selectedGoal?.id && "bg-primary/5")}
                          key={goal.id}
                        >
                          <TableCell>
                            <div className="flex min-w-0 flex-col gap-1">
                              <span className="font-medium">{goal.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {progress.percent.toFixed(1)}% concluído
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(goal.targetAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(progress.currentAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(progress.remainingAmount)}
                          </TableCell>
                          <TableCell>{formatGoalDeadline(goal)}</TableCell>
                          <TableCell>
                            <GoalStatusBadge completed={completed} status={goal.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                aria-label="Editar meta"
                                onClick={() => openEditGoal(goal)}
                                size="icon-sm"
                                variant="ghost"
                              >
                                <Edit3Icon />
                              </Button>
                              <Button
                                aria-label="Excluir meta"
                                onClick={() => handleDeleteGoal(goal)}
                                size="icon-sm"
                                variant="ghost"
                              >
                                <Trash2Icon className="text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </>
      )}

      {isGoalDialogOpen ? (
        <GoalDialog
          goal={
            editingGoal &&
            isGoalCompleted(
              editingGoal,
              contributions.filter((item) => item.goalId === editingGoal.id),
            )
              ? { ...editingGoal, status: "Concluída" }
              : editingGoal
          }
          onOpenChange={setIsGoalDialogOpen}
          onSubmit={async (values) => {
            const currentAmount = editingGoal
              ? getGoalProgress(
                  editingGoal,
                  contributions.filter((item) => item.goalId === editingGoal.id),
                ).currentAmount
              : 0

            await runGoalAction(
              () => onUpsertGoal(normalizeGoalFormValues(values, currentAmount), editingGoal?.id),
              editingGoal ? "Meta atualizada" : "Meta criada",
            )
          }}
          open={isGoalDialogOpen}
        />
      ) : null}

      {isContributionDialogOpen ? (
        <GoalContributionDialog
          defaultGoalId={selectedGoal?.id ?? goals[0]?.id ?? ""}
          goals={goals}
          contribution={editingContribution}
          onOpenChange={(open) => {
            setIsContributionDialogOpen(open)
            if (!open) {
              setEditingContribution(null)
            }
          }}
          onSubmit={async (values, id) => {
            await runGoalAction(
              () => onUpsertContribution(values, id),
              editingContribution ? "Aporte atualizado" : "Aporte registrado",
            )
          }}
          open={isContributionDialogOpen}
        />
      ) : null}
    </div>
  )
}
