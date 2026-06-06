export const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
})

export const percentFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
  style: "percent",
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatPercent(value: number) {
  return percentFormatter.format(value / 100)
}

export function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)
  const date = new Date(year, month - 1, 2)

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date)
}

export function formatMonthChip(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)
  const date = new Date(year, month - 1, 2)

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  })
    .format(date)
    .replace(".", "")
    .replace(" de ", "/")
}

export function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(dateIso))
}

export function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(date)
}

export function formatDateKeyLong(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(date)
}

export function formatDueDay(day: number) {
  return `Todo dia ${String(day).padStart(2, "0")}`
}
