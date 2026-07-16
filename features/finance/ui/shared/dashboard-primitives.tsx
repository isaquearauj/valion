import {
  CheckCircle2Icon,
  Edit3Icon,
  PlusIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  ExpenseStatus,
  GoalStatus,
  ReminderStatus,
  ReminderType,
} from "@/features/finance/domain/types"
import { cn } from "@/lib/utils"

export const TABLE_PAGE_SIZE = 10

export type FieldErrorLike = {
  message?: string
}

export function getActionErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação."
}

export function SectionHeader({
  actionLabel,
  actionClassName,
  description,
  onAction,
  title,
}: {
  actionLabel?: string
  actionClassName?: string
  description: string
  onAction?: () => void
  title: string
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button className={cn("w-full sm:w-auto", actionClassName)} onClick={onAction}>
          <PlusIcon data-icon="inline-start" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-card/90 shadow-sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-mono text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

export function ResponsiveTable({ children }: { children: ReactNode }) {
  return <div className="w-full overflow-x-auto rounded-xl border">{children}</div>
}

export function PaginationControls({
  currentPage,
  itemLabel,
  onPageChange,
  pageCount,
  totalItems,
}: {
  currentPage: number
  itemLabel: string
  onPageChange: (page: number) => void
  pageCount: number
  totalItems: number
}) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * TABLE_PAGE_SIZE + 1
  const endItem = Math.min(currentPage * TABLE_PAGE_SIZE, totalItems)

  return (
    <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Mostrando {startItem}-{endItem} de {totalItems} {itemLabel}
      </span>
      <div className="flex items-center gap-2">
        <Button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          size="sm"
          variant="outline"
        >
          Anterior
        </Button>
        <span className="font-mono text-xs tabular-nums">
          {currentPage}/{pageCount}
        </span>
        <Button
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
          size="sm"
          variant="outline"
        >
          Próxima
        </Button>
      </div>
    </div>
  )
}

export function TableActions({
  onDelete,
  onEdit,
}: {
  onDelete: () => Promise<void> | void
  onEdit: () => void
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button aria-label="Editar" onClick={onEdit} size="icon-sm" variant="ghost">
        <Edit3Icon />
      </Button>
      <Button aria-label="Excluir" onClick={onDelete} size="icon-sm" variant="ghost">
        <Trash2Icon className="text-destructive" />
      </Button>
    </div>
  )
}

export function SelectField<T extends string>({
  error,
  label,
  onValueChange,
  options,
  value,
}: {
  error?: FieldErrorLike
  label: string
  onValueChange: (value: T) => void
  options: readonly T[]
  value: T
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel>{label}</FieldLabel>
      <Select
        items={options.map((option) => ({ label: option, value: option }))}
        onValueChange={(nextValue) => {
          if (nextValue !== null) {
            onValueChange(nextValue as T)
          }
        }}
        value={value}
      >
        <SelectTrigger aria-invalid={Boolean(error)} aria-label={label} className="h-9 w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldError>{error?.message}</FieldError>
    </Field>
  )
}

export function TextInputField({
  description,
  error,
  label,
  registration,
  type = "text",
}: {
  description?: string
  error?: FieldErrorLike
  label: string
  registration: UseFormRegisterReturn
  type?: string
}) {
  const id = registration.name

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        aria-invalid={Boolean(error)}
        id={id}
        inputMode={type === "number" ? "decimal" : undefined}
        step={type === "number" ? "0.01" : undefined}
        type={type}
        {...registration}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error?.message}</FieldError>
    </Field>
  )
}

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  const variant = status === "Ativa" ? "default" : status === "Pausada" ? "secondary" : "outline"

  return <Badge variant={variant}>{status}</Badge>
}

export function ReminderStatusBadge({ status }: { status: ReminderStatus }) {
  const variant = status === "Ativo" ? "default" : status === "Pausado" ? "secondary" : "outline"

  return <Badge variant={variant}>{status}</Badge>
}

export function ReminderTypeBadge({ type }: { type: ReminderType }) {
  const variant = type === "Parcelado" ? "secondary" : "outline"

  return <Badge variant={variant}>{type}</Badge>
}

export function GoalStatusBadge({
  completed = false,
  status,
}: {
  completed?: boolean
  status: GoalStatus
}) {
  if (completed || status === "Concluída") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
        Concluída
      </Badge>
    )
  }

  const variant = status === "Ativa" ? "default" : "secondary"

  return <Badge variant={variant}>{status}</Badge>
}

export function getInvestmentInsight(status: "above" | "below" | "on-track") {
  if (status === "above") {
    return {
      description:
        "Você investiu acima do planejado. Ótimo momento para revisar se ainda há reserva para despesas variáveis.",
      icon: TrendingUpIcon,
      title: "Acima do planejado",
    }
  }

  if (status === "below") {
    return {
      description:
        "Você investiu abaixo do planejado. Avalie despesas flexíveis ou ajuste a meta para manter consistência.",
      icon: TrendingDownIcon,
      title: "Abaixo do planejado",
    }
  }

  return {
    description:
      "Você investiu exatamente o esperado para o mês. A rotina está alinhada ao plano definido.",
    icon: CheckCircle2Icon,
    title: "Dentro do esperado",
  }
}
