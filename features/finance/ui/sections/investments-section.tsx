"use client"

import { PlusIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { calculateFinanceSummary } from "@/features/finance/domain/calculations"
import type { InvestmentEntry } from "@/features/finance/domain/types"
import {
  getInvestmentInsight,
  MetricCard,
  ResponsiveTable,
  SectionHeader,
  TableActions,
} from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatMonth } from "@/lib/formatters"

export function InvestmentsSection({
  investments,
  onAdd,
  onDelete,
  onEdit,
  summary,
}: {
  investments: InvestmentEntry[]
  onAdd: () => void
  onDelete: (investment: InvestmentEntry) => Promise<void> | void
  onEdit: (investment: InvestmentEntry) => void
  summary: ReturnType<typeof calculateFinanceSummary>
}) {
  const insight = getInvestmentInsight(summary.investmentInsight)
  const InsightIcon = insight.icon

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Defina o planejado, registre o realizado e compare a evolução mensal."
        title="Controle de investimentos"
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <MetricCard label="Planejado" value={formatCurrency(summary.plannedInvestment)} />
        <MetricCard label="Realizado" value={formatCurrency(summary.investedAmount)} />
        <MetricCard
          label="Orçamento após investimentos"
          value={formatCurrency(summary.budgetRemainingAfterInvestment)}
        />
      </div>

      <Alert>
        <InsightIcon />
        <AlertTitle>{insight.title}</AlertTitle>
        <AlertDescription>{insight.description}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Histórico mensal de investimentos</CardTitle>
            <CardDescription>
              Use o mês atual para calcular o orçamento após investimentos.
            </CardDescription>
          </div>
          <CardAction>
            <Button
              className="border-sky-500/30 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 focus-visible:ring-sky-500/30 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20"
              onClick={onAdd}
              variant="outline"
            >
              <PlusIcon data-icon="inline-start" />
              Registrar aporte
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Planejado</TableHead>
                  <TableHead className="text-right">Realizado</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((investment) => {
                  const delta = investment.investedAmount - investment.plannedAmount

                  return (
                    <TableRow key={investment.id}>
                      <TableCell>{formatMonth(investment.month)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(investment.plannedAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(investment.investedAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(delta)}
                      </TableCell>
                      <TableCell>
                        <TableActions
                          onDelete={() => onDelete(investment)}
                          onEdit={() => onEdit(investment)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>
    </div>
  )
}
