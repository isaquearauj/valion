import {
  CheckCircle2Icon,
  Edit3Icon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  XIcon,
} from "lucide-react"
import { type ComponentType, type ReactNode, useId, useMemo } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AppTooltip } from "@/components/ui/tooltip"
import type {
  ExpenseStatus,
  GoalStatus,
  ReminderStatus,
  ReminderType,
} from "@/features/finance/domain/types"
import { cn } from "@/lib/utils"

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
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <h2 className="font-heading text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-[2rem]">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {actionLabel && onAction ? (
        <Button className={cn("w-full sm:w-auto", actionClassName)} onClick={onAction} size="lg">
          <PlusIcon data-icon="inline-start" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

export function CollectionCardHeader({
  actionClassName,
  actionLabel,
  description,
  onAction,
  title,
  tone = "neutral",
}: {
  actionClassName?: string
  actionLabel: string
  description: string
  onAction: () => void
  title: string
  tone?: "neutral" | "income" | "expense" | "warning"
}) {
  const actionToneClassName = {
    neutral: "",
    income:
      "bg-finance-income text-white hover:bg-finance-income/90 focus-visible:ring-finance-income/30",
    expense:
      "bg-finance-expense text-white hover:bg-finance-expense/90 focus-visible:ring-finance-expense/30",
    warning:
      "bg-finance-warning-action text-white hover:bg-finance-warning-action/90 focus-visible:ring-finance-warning-action/40",
  }[tone]

  return (
    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <Button
        className={cn("w-full shrink-0 sm:w-44", actionToneClassName, actionClassName)}
        onClick={onAction}
        size="lg"
      >
        <PlusIcon data-icon="inline-start" />
        {actionLabel}
      </Button>
    </CardHeader>
  )
}

export function MetricCard({
  hint,
  icon: Icon,
  label,
  tone = "neutral",
  value,
}: {
  hint?: string
  icon?: ComponentType<{ className?: string }>
  label: string
  tone?: "neutral" | "income" | "expense" | "info"
  value: string
}) {
  return (
    <Card className="min-w-0 justify-center border-border/80 py-5">
      <CardHeader className="flex flex-row items-center gap-4">
        {Icon ? (
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary",
              tone === "income" && "bg-finance-income-soft text-finance-income",
              tone === "expense" && "bg-finance-expense-soft text-finance-expense",
              tone === "info" && "bg-finance-info-soft text-finance-info",
            )}
          >
            <Icon className="size-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <CardDescription className="text-xs font-medium sm:text-sm">{label}</CardDescription>
          <CardTitle
            className={cn(
              "mt-1 font-heading text-xl font-extrabold tracking-tight tabular-nums sm:text-2xl",
              tone === "income" && "text-finance-income",
              tone === "expense" && "text-finance-expense",
            )}
          >
            {value}
          </CardTitle>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardHeader>
    </Card>
  )
}

export function ResponsiveTable({
  children,
  className,
  desktopOnly = false,
}: {
  children: ReactNode
  className?: string
  desktopOnly?: boolean
}) {
  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border bg-card overflow-hidden",
        desktopOnly && "hidden md:block",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CollectionSearch({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  const controlId = useId()

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <label
        className="text-xs font-semibold leading-none text-muted-foreground"
        htmlFor={controlId}
      >
        Buscar
      </label>
      <div className="relative w-full">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label={label}
          className="h-11 bg-background pl-10"
          id={controlId}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          type="search"
          value={value}
        />
      </div>
    </div>
  )
}

export type CollectionFilterOption = {
  label: string
  value: string
}

export type ActiveCollectionFilter = {
  key: string
  label: string
  onRemove: () => void
}

export function CollectionFilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: readonly CollectionFilterOption[]
  value: string
}) {
  const controlId = useId()
  const selectedLabel = options.find((option) => option.value === value)?.label ?? label

  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:w-40 xl:w-44 shrink-0">
      <label
        className="text-xs font-semibold leading-none text-muted-foreground"
        htmlFor={controlId}
      >
        {label}
      </label>
      <Select onValueChange={(nextValue) => onChange(nextValue ?? "all")} value={value}>
        <SelectTrigger className="h-11 w-full min-w-0 bg-background" id={controlId}>
          <SelectValue>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function CollectionToolbar({
  activeFilters,
  children,
  itemLabel,
  onClearFilters,
  onQueryChange,
  query,
  searchLabel,
  totalItems,
  visibleItems,
}: {
  activeFilters: ActiveCollectionFilter[]
  children: ReactNode
  itemLabel: string
  onClearFilters: () => void
  onQueryChange: (value: string) => void
  query: string
  searchLabel: string
  totalItems: number
  visibleItems: number
}) {
  const searchTerm = query.trim()
  const visibleFilters = [
    ...(searchTerm
      ? [{ key: "search", label: `Busca: ${searchTerm}`, onRemove: () => onQueryChange("") }]
      : []),
    ...activeFilters,
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          <CollectionSearch label={searchLabel} onChange={onQueryChange} value={query} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">{children}</div>
      </div>
      <div className="flex flex-col gap-2 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Exibindo <span className="font-semibold text-foreground">{visibleItems}</span> de{" "}
          <span className="font-semibold text-foreground">{totalItems}</span> {itemLabel}
        </p>
        {visibleFilters.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {visibleFilters.map((filter) => (
              <AppTooltip content="Remover filtro" key={filter.key}>
                <button
                  aria-label={`Remover filtro ${filter.label}`}
                  className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={filter.onRemove}
                  type="button"
                >
                  <span className="truncate">{filter.label}</span>
                  <XIcon aria-hidden="true" className="size-3.5 shrink-0" />
                </button>
              </AppTooltip>
            ))}
            <Button className="h-7 px-2 text-xs" onClick={onClearFilters} size="sm" variant="ghost">
              Limpar filtros
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function CollectionEmpty({
  actionLabel,
  description,
  onAction,
  title,
}: {
  actionLabel?: string
  description: string
  onAction?: () => void
  title: string
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
      <p className="font-heading text-base font-bold">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
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
      <AppTooltip content="Editar">
        <Button aria-label="Editar" onClick={onEdit} size="icon-sm" variant="ghost">
          <Edit3Icon />
        </Button>
      </AppTooltip>
      <AppTooltip content="Excluir">
        <Button aria-label="Excluir" onClick={onDelete} size="icon-sm" variant="ghost">
          <Trash2Icon className="text-destructive" />
        </Button>
      </AppTooltip>
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
  const items = useMemo(
    () => options.map((option) => ({ label: option, value: option })),
    [options],
  )

  return (
    <div className="flex w-full flex-col gap-1.5" data-invalid={Boolean(error)}>
      <span className="text-xs font-semibold leading-none text-foreground select-none">
        {label}
      </span>
      <Select
        items={items}
        onValueChange={(nextValue) => {
          if (nextValue !== null) {
            onValueChange(nextValue as T)
          }
        }}
        value={value}
      >
        <SelectTrigger aria-invalid={Boolean(error)} aria-label={label} className="w-full">
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
      {error?.message ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error.message}
        </p>
      ) : null}
    </div>
  )
}

export function TextInputField({
  description,
  error,
  label,
  placeholder,
  registration,
  type = "text",
}: {
  description?: string
  error?: FieldErrorLike
  label: string
  placeholder?: string
  registration: UseFormRegisterReturn
  type?: string
}) {
  const id = registration.name

  return (
    <div className="flex w-full flex-col gap-1.5" data-invalid={Boolean(error)}>
      <label
        htmlFor={id}
        className="text-xs font-semibold leading-none text-foreground select-none"
      >
        {label}
      </label>
      <Input
        aria-invalid={Boolean(error)}
        id={id}
        inputMode={type === "number" ? "decimal" : undefined}
        placeholder={placeholder}
        step={type === "number" ? "0.01" : undefined}
        type={type}
        {...registration}
      />
      {description ? (
        <p className="text-left text-xs leading-normal text-muted-foreground">{description}</p>
      ) : null}
      {error?.message ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error.message}
        </p>
      ) : null}
    </div>
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
    return <Badge className="bg-finance-income-soft text-finance-income">Concluída</Badge>
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
