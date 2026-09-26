import { formatCurrency, formatPercent } from "@/lib/formatters"
import { cn } from "@/lib/utils"

export function TrendDelta({
  inverse,
  kind = "currency",
  value,
}: {
  inverse?: boolean
  kind?: "currency" | "percent"
  value: number
}) {
  const isNeutral = Math.abs(value) < 0.01
  const isPositive = inverse ? value < 0 : value > 0
  const formattedValue =
    kind === "percent" ? formatPercent(Math.abs(value)) : formatCurrency(Math.abs(value))
  const prefix = value > 0 ? "+" : value < 0 ? "-" : ""

  return (
    <span
      className={cn(
        "font-mono text-xs font-semibold tabular-nums",
        isNeutral && "text-muted-foreground",
        !isNeutral && isPositive && "text-emerald-600 dark:text-emerald-300",
        !isNeutral && !isPositive && "text-rose-600 dark:text-rose-300",
      )}
    >
      {prefix}
      {formattedValue}
    </span>
  )
}

export function ChartLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2 rounded-[2px]" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}
