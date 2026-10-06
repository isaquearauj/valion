"use client"

import {
  CalendarIcon,
  CheckCircle2Icon,
  EyeIcon,
  PercentIcon,
  PiggyBankIcon,
  PlusIcon,
  TargetIcon,
  TrendingUpIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AppTooltip } from "@/components/ui/tooltip"
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
  type ActiveCollectionFilter,
  CollectionCardHeader,
  CollectionEmpty,
  type CollectionFilterOption,
  CollectionFilterSelect,
  CollectionToolbar,
  GoalStatusBadge,
  getActionErrorMessage,
  MetricCard,
  ResponsiveTable,
  SectionHeader,
  TableActions,
} from "@/features/finance/ui/shared/dashboard-primitives"
import {
  formatCurrency,
  formatDateKeyLong,
  formatDateKeyShort,
  formatPercent,
} from "@/lib/formatters"

type GoalStatusFilter = "all" | "active" | "completed" | "paused"

const goalStatusFilterOptions: CollectionFilterOption[] = [
  { label: "Todos os status", value: "all" },
  { label: "Ativas", value: "active" },
  { label: "Concluídas", value: "completed" },
  { label: "Pausadas", value: "paused" },
]

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
  const [inspectedGoalId, setInspectedGoalId] = useState<string | null>(null)
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false)
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editingContribution, setEditingContribution] = useState<GoalContribution | null>(null)

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<GoalStatusFilter>("all")
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null)
  const [contributionToDelete, setContributionToDelete] = useState<GoalContribution | null>(null)

  const goalsSummary = useMemo(
    () => calculateGoalsSummary(goals, contributions),
    [contributions, goals],
  )

  const inspectedGoal = useMemo(() => {
    if (!inspectedGoalId) {
      return null
    }
    return goals.find((goal) => goal.id === inspectedGoalId) ?? null
  }, [goals, inspectedGoalId])

  const inspectedGoalContributions = useMemo(() => {
    if (!inspectedGoal) {
      return []
    }

    return contributions
      .filter((contribution) => contribution.goalId === inspectedGoal.id)
      .toSorted((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
  }, [contributions, inspectedGoal])

  const inspectedGoalProgress = useMemo(
    () => (inspectedGoal ? getGoalProgress(inspectedGoal, inspectedGoalContributions) : null),
    [inspectedGoal, inspectedGoalContributions],
  )

  const inspectedGoalCompleted = Boolean(
    inspectedGoalProgress && inspectedGoalProgress.percent >= 100,
  )

  const inspectedGoalTimeline = useMemo(
    () => (inspectedGoal ? getGoalTimeline(inspectedGoal, inspectedGoalContributions) : []),
    [inspectedGoal, inspectedGoalContributions],
  )

  const chartMaxValue = inspectedGoal
    ? Math.max(
        inspectedGoal.targetAmount,
        inspectedGoalTimeline.at(-1)?.cumulativeAmount ?? 0,
        1000,
      )
    : 1000

  const inspectedGoalDeadlineLabel = inspectedGoal ? formatGoalDeadline(inspectedGoal) : "Sem prazo"

  const filteredGoals = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR")

    return goals.filter((goal) => {
      const matchesQuery =
        !normalizedQuery || goal.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery)

      const progress = getGoalProgress(
        goal,
        contributions.filter((item) => item.goalId === goal.id),
      )
      const isCompleted = progress.percent >= 100 || goal.status === "Concluída"

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && isCompleted) ||
        (statusFilter === "active" && !isCompleted && goal.status === "Ativa") ||
        (statusFilter === "paused" && goal.status === "Pausada")

      return matchesQuery && matchesStatus
    })
  }, [contributions, goals, query, statusFilter])

  const activeFilters: ActiveCollectionFilter[] = []
  if (statusFilter !== "all") {
    const statusLabels: Record<GoalStatusFilter, string> = {
      all: "Todos",
      active: "Ativas",
      completed: "Concluídas",
      paused: "Pausadas",
    }
    activeFilters.push({
      key: "status",
      label: `Status: ${statusLabels[statusFilter]}`,
      onRemove: () => setStatusFilter("all"),
    })
  }

  function openCreateGoal() {
    setEditingGoal(null)
    setIsGoalDialogOpen(true)
  }

  function openEditGoal(goal: Goal) {
    setEditingGoal(goal)
    setIsGoalDialogOpen(true)
  }

  function openContributionDialog(goalId?: string) {
    const targetGoalId = goalId ?? inspectedGoal?.id ?? goals[0]?.id

    if (!targetGoalId) {
      return
    }

    setEditingContribution(null)
    setContributionGoalId(targetGoalId)
    setIsContributionDialogOpen(true)
  }

  function openEditContribution(contribution: GoalContribution) {
    setEditingContribution(contribution)
    setContributionGoalId(contribution.goalId)
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

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Crie objetivos financeiros, registre aportes e acompanhe a evolução até a conclusão."
        title="Metas financeiras"
      />

      {/* 3 KPI Cards padronizados com as demais telas */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          hint={`${goalsSummary.activeGoals} meta(s) ativa(s)`}
          icon={PiggyBankIcon}
          label="Valor alvo total"
          value={formatCurrency(goalsSummary.totalTarget)}
        />
        <MetricCard
          hint="Total já acumulado"
          icon={TrendingUpIcon}
          label="Valor aportado"
          tone="income"
          value={formatCurrency(goalsSummary.totalContributed)}
        />
        <MetricCard
          hint="Do objetivo global"
          icon={PercentIcon}
          label="Taxa de conclusão"
          tone={goalsSummary.completionRate >= 100 ? "income" : "info"}
          value={formatPercent(goalsSummary.completionRate)}
        />
      </div>

      {!goals.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <TargetIcon className="size-10 text-muted-foreground" />
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-semibold">Nenhuma meta criada ainda</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Registre objetivos como uma reserva de emergência, uma casa ou uma viagem e
                acompanhe o progresso por aportes.
              </p>
            </div>
            <Button onClick={openCreateGoal}>Criar primeira meta</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CollectionCardHeader
            actionLabel="Criar meta"
            description="Visão consolidada dos seus objetivos. Clique em uma meta para inspecionar gráficos e aportes."
            onAction={openCreateGoal}
            title="Minhas metas"
          />
          <CardContent className="space-y-4">
            <CollectionToolbar
              activeFilters={activeFilters}
              itemLabel="metas"
              onClearFilters={() => {
                setQuery("")
                setStatusFilter("all")
              }}
              onQueryChange={setQuery}
              query={query}
              searchLabel="Buscar meta..."
              totalItems={goals.length}
              visibleItems={filteredGoals.length}
            >
              <CollectionFilterSelect
                label="Status"
                onChange={(val) => setStatusFilter(val as GoalStatusFilter)}
                options={goalStatusFilterOptions}
                value={statusFilter}
              />
            </CollectionToolbar>

            {filteredGoals.length ? (
              <>
                <ResponsiveTable desktopOnly>
                  <Table containerClassName="max-h-[30rem] overflow-auto">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Meta</TableHead>
                        <TableHead className="w-44">Progresso</TableHead>
                        <TableHead className="text-right">Alvo</TableHead>
                        <TableHead className="text-right">Acumulado</TableHead>
                        <TableHead className="text-right">Restante</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGoals.map((goal) => {
                        const progress = getGoalProgress(
                          goal,
                          contributions.filter((item) => item.goalId === goal.id),
                        )
                        const completed = progress.percent >= 100

                        return (
                          <TableRow
                            className="group cursor-pointer transition-colors hover:bg-muted/50"
                            key={goal.id}
                            onClick={() => setInspectedGoalId(goal.id)}
                          >
                            <TableCell>
                              <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="font-semibold transition-colors group-hover:text-primary">
                                  {goal.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatGoalDeadline(goal)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5">
                                <Progress className="h-2" value={progress.percent} />
                                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                  {progress.percent.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {formatCurrency(goal.targetAmount)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold tabular-nums text-finance-income">
                              {formatCurrency(progress.currentAmount)}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                              {formatCurrency(progress.remainingAmount)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatGoalDeadline(goal)}
                            </TableCell>
                            <TableCell>
                              <GoalStatusBadge completed={completed} status={goal.status} />
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <AppTooltip content="Ver detalhes">
                                  <Button
                                    aria-label="Ver detalhes"
                                    onClick={() => setInspectedGoalId(goal.id)}
                                    size="icon-sm"
                                    variant="ghost"
                                  >
                                    <EyeIcon />
                                  </Button>
                                </AppTooltip>
                                <TableActions
                                  onDelete={() => setGoalToDelete(goal)}
                                  onEdit={() => openEditGoal(goal)}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ResponsiveTable>

                <div className="flex max-h-[30rem] flex-col gap-3 overflow-y-auto pr-1 md:hidden">
                  {filteredGoals.map((goal) => {
                    const progress = getGoalProgress(
                      goal,
                      contributions.filter((item) => item.goalId === goal.id),
                    )
                    return (
                      <article
                        className="rounded-xl border border-border bg-background p-4 shadow-xs transition-colors hover:border-primary/40"
                        key={goal.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-heading font-bold">{goal.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatGoalDeadline(goal)}
                            </p>
                          </div>
                          <GoalStatusBadge
                            completed={progress.percent >= 100}
                            status={goal.status}
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="font-semibold tabular-nums text-finance-income">
                            {formatCurrency(progress.currentAmount)}
                          </span>
                          <span className="text-muted-foreground">
                            de {formatCurrency(goal.targetAmount)}
                          </span>
                        </div>
                        <Progress className="mt-2 h-2" value={progress.percent} />

                        <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                          <Button
                            className="h-8 gap-1.5 text-xs font-medium"
                            onClick={() => setInspectedGoalId(goal.id)}
                            size="sm"
                            variant="outline"
                          >
                            <EyeIcon className="size-3.5" />
                            Ver detalhes
                          </Button>
                          <TableActions
                            onDelete={() => setGoalToDelete(goal)}
                            onEdit={() => openEditGoal(goal)}
                          />
                        </div>
                      </article>
                    )
                  })}
                </div>
              </>
            ) : (
              <CollectionEmpty
                description={
                  goals.length
                    ? "Tente outro termo de busca ou altere o filtro de status."
                    : "Crie sua primeira meta para acompanhar o progresso dos seus sonhos."
                }
                title={goals.length ? "Nenhuma meta encontrada" : "Nenhuma meta criada"}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal Detalhado da Meta (Visão Imersiva / Premium) */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setInspectedGoalId(null)
          }
        }}
        open={Boolean(inspectedGoal)}
      >
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden p-4 sm:max-w-4xl sm:p-5 lg:max-w-4xl xl:max-w-5xl">
          {inspectedGoal && inspectedGoalProgress ? (
            <div className="flex flex-col gap-3.5">
              {/* Cabeçalho do Modal Compacto */}
              <DialogHeader className="gap-1 pb-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="font-heading text-lg font-bold sm:text-xl">
                    {inspectedGoal.name}
                  </DialogTitle>
                  <GoalStatusBadge
                    completed={inspectedGoalCompleted}
                    status={inspectedGoal.status}
                  />
                  <Badge
                    className="gap-1 text-[11px] font-normal text-muted-foreground"
                    variant="outline"
                  >
                    <CalendarIcon className="size-3" />
                    {inspectedGoalDeadlineLabel}
                  </Badge>
                  {inspectedGoalCompleted ? (
                    <Badge className="gap-1 bg-finance-income-soft text-[11px] text-finance-income">
                      <CheckCircle2Icon className="size-3" />
                      Concluída
                    </Badge>
                  ) : null}
                </div>
                <DialogDescription className="sr-only">
                  Detalhes e evolução da meta {inspectedGoal.name}
                </DialogDescription>
              </DialogHeader>

              {/* Hero de Métricas da Meta - Compacto e com ordem lógica */}
              <div className="flex flex-col gap-2 rounded-xl border bg-muted/20 px-3.5 py-2.5">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Valor alvo
                    </p>
                    <p className="font-heading text-base font-bold tabular-nums sm:text-lg">
                      {formatCurrency(inspectedGoal.targetAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Acumulado
                    </p>
                    <p className="font-heading text-base font-bold tabular-nums text-finance-income sm:text-lg">
                      {formatCurrency(inspectedGoalProgress.currentAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Falta atingir
                    </p>
                    <p className="font-heading text-base font-bold tabular-nums sm:text-lg">
                      {formatCurrency(inspectedGoalProgress.remainingAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Conclusão
                    </p>
                    <p className="font-heading text-base font-bold tabular-nums sm:text-lg">
                      {inspectedGoalProgress.percent.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Progresso acumulado</span>
                    <span className="font-mono">{inspectedGoalProgress.percent.toFixed(1)}%</span>
                  </div>
                  <Progress className="h-1.5" value={inspectedGoalProgress.percent} />
                </div>
              </div>

              {/* Grid em 2 colunas: Gráfico e Histórico de Aportes */}
              <div className="grid items-stretch gap-3.5 lg:grid-cols-[1.1fr_0.9fr]">
                {/* Coluna 1: Gráfico de Evolução */}
                <Card className="bg-background shadow-xs">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm font-semibold">Evolução dos aportes</CardTitle>
                    <CardDescription className="text-[11px]">
                      Acompanhe o crescimento acumulado até a meta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-hidden p-3 pt-1">
                    {inspectedGoalTimeline.length ? (
                      <>
                        <ChartContainer className="h-[185px] w-full" config={goalChartConfig}>
                          <LineChart
                            accessibilityLayer
                            data={inspectedGoalTimeline}
                            margin={{ bottom: 0, left: 16, right: 12, top: 8 }}
                          >
                            <CartesianGrid vertical={false} />
                            <XAxis
                              axisLine={false}
                              dataKey="label"
                              tick={{ fontSize: 10 }}
                              tickLine={false}
                              tickMargin={6}
                            />
                            <YAxis
                              axisLine={false}
                              domain={[0, chartMaxValue + 1000]}
                              tick={{ fontSize: 10 }}
                              tickFormatter={(value) => formatShortCurrency(Number(value))}
                              tickLine={false}
                              width={52}
                            />
                            <ChartTooltip content={<GoalTooltip />} />
                            <ReferenceLine
                              ifOverflow="extendDomain"
                              label="Meta"
                              stroke="var(--color-targetAmount)"
                              strokeDasharray="6 6"
                              y={inspectedGoal.targetAmount}
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
                        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-3 text-[11px]">
                          <ChartLegendItem color="var(--chart-3)" label="Acumulado" />
                          <ChartLegendItem color="var(--chart-4)" label="Meta" />
                        </div>
                      </>
                    ) : (
                      <div className="flex h-[185px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 text-center">
                        <TargetIcon className="size-7 text-muted-foreground" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium">Nenhum aporte registrado</p>
                          <p className="text-[11px] text-muted-foreground">
                            Registre um aporte para visualizar o gráfico.
                          </p>
                        </div>
                        <Button
                          className="h-7 px-2.5 text-xs"
                          onClick={() => openContributionDialog(inspectedGoal.id)}
                          size="sm"
                        >
                          <PlusIcon data-icon="inline-start" />
                          Primeiro aporte
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Coluna 2: Histórico de Aportes */}
                <Card className="flex flex-col bg-background shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
                    <div>
                      <CardTitle className="text-sm font-semibold">Aportes da meta</CardTitle>
                      <CardDescription className="text-[11px]">
                        {inspectedGoalContributions.length} registro(s) vinculado(s)
                      </CardDescription>
                    </div>
                    <Button
                      className="h-7 gap-1 px-2.5 text-xs font-medium"
                      onClick={() => openContributionDialog(inspectedGoal.id)}
                      size="sm"
                    >
                      <PlusIcon className="size-3.5" />
                      Registrar aporte
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 p-3 pt-1">
                    {inspectedGoalContributions.length ? (
                      <div className="max-h-[195px] overflow-x-hidden overflow-y-auto rounded-md border border-border/60">
                        <table className="w-full table-fixed text-xs">
                          <thead className="sticky top-0 z-10 border-b border-border/60 bg-muted/90 text-muted-foreground backdrop-blur-xs">
                            <tr>
                              <th className="w-[38%] px-2.5 py-1.5 text-left font-medium">Data</th>
                              <th className="w-[37%] px-2 py-1.5 text-right font-medium">Valor</th>
                              <th className="w-[25%] px-2 py-1.5 text-right font-medium">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {inspectedGoalContributions
                              .toSorted((a, b) => b.date.localeCompare(a.date))
                              .map((contribution) => (
                                <tr
                                  className="transition-colors hover:bg-muted/30"
                                  key={contribution.id}
                                >
                                  <td className="truncate px-2.5 py-1.5 font-mono text-[11px] text-foreground">
                                    {formatDateKeyShort(contribution.date)}
                                  </td>
                                  <td className="truncate px-2 py-1.5 text-right font-mono text-xs font-semibold tabular-nums text-finance-income">
                                    {formatCurrency(contribution.amount)}
                                  </td>
                                  <td className="px-2 py-1.5 text-right">
                                    <TableActions
                                      onDelete={() => setContributionToDelete(contribution)}
                                      onEdit={() => openEditContribution(contribution)}
                                    />
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex h-[185px] flex-col items-center justify-center rounded-xl border border-dashed px-4 py-4 text-center text-xs text-muted-foreground">
                        Nenhum aporte registrado para esta meta ainda.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Dialog para Criar / Editar Meta */}
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

      {/* Dialog para Registrar / Editar Aporte */}
      {isContributionDialogOpen ? (
        <GoalContributionDialog
          contribution={editingContribution}
          defaultGoalId={contributionGoalId ?? inspectedGoal?.id ?? goals[0]?.id ?? ""}
          goals={goals}
          hideGoalSelect={Boolean(contributionGoalId ?? inspectedGoal?.id)}
          onOpenChange={(open) => {
            setIsContributionDialogOpen(open)
            if (!open) {
              setEditingContribution(null)
              setContributionGoalId(null)
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

      {/* ConfirmDialog para Exclusão de Meta */}
      <ConfirmDialog
        confirmText="Excluir meta"
        description="Esta ação é permanente e também removerá todos os aportes vinculados a esta meta."
        destructive
        onConfirm={async () => {
          if (goalToDelete) {
            await onDeleteGoal(goalToDelete.id)
            if (inspectedGoalId === goalToDelete.id) {
              setInspectedGoalId(null)
            }
            toast.success("Meta excluída")
          }
        }}
        onOpenChange={(open) => !open && setGoalToDelete(null)}
        open={Boolean(goalToDelete)}
        title={`Excluir a meta "${goalToDelete?.name}"?`}
      />

      {/* ConfirmDialog para Exclusão de Aporte */}
      <ConfirmDialog
        confirmText="Excluir aporte"
        description={
          contributionToDelete
            ? `Deseja excluir o aporte de ${formatCurrency(contributionToDelete.amount)} realizado em ${formatDateKeyLong(contributionToDelete.date)}?`
            : undefined
        }
        destructive
        onConfirm={async () => {
          if (contributionToDelete) {
            await onDeleteContribution(contributionToDelete.id)
            toast.success("Aporte removido")
          }
        }}
        onOpenChange={(open) => !open && setContributionToDelete(null)}
        open={Boolean(contributionToDelete)}
        title="Excluir este aporte?"
      />
    </div>
  )
}
