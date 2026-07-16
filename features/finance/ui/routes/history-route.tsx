"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getMonthlyHistory } from "@/features/finance/domain/calculations"
import { useFinance } from "@/features/finance/providers/finance-provider"
import { SectionHeader } from "@/features/finance/ui/shared/dashboard-primitives"
import { formatCurrency, formatMonth } from "@/lib/formatters"

export function HistoryRoute() {
  const finance = useFinance()
  const history = useMemo(() => getMonthlyHistory(finance.state).toReversed(), [finance.state])

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        description="Consulte os snapshots mensais preservados e compare entradas, compromissos e investimentos."
        title="Histórico financeiro"
      />
      <Card>
        <CardHeader>
          <CardTitle>Resumo por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Receitas</TableHead>
                <TableHead className="text-right">Despesas</TableHead>
                <TableHead className="text-right">Investido</TableHead>
                <TableHead className="text-right">Saldo antes do investimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length ? (
                history.map((snapshot) => (
                  <TableRow key={snapshot.id}>
                    <TableCell className="font-medium">{formatMonth(snapshot.month)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(snapshot.income)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(snapshot.expenses)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(snapshot.investedAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(snapshot.income - snapshot.expenses)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
                    O histórico aparecerá após o primeiro carregamento do mês.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
