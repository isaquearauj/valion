export type AppSection =
  | "dashboard"
  | "incomes"
  | "expenses"
  | "goals"
  | "investments"
  | "history"

export type AuthMode = "login" | "register" | "recover"

export const appSectionPaths: Record<AppSection, string> = {
  dashboard: "/dashboard",
  expenses: "/despesas",
  goals: "/metas",
  history: "/historico",
  incomes: "/receitas",
  investments: "/investimentos",
}

const appSectionsByPath = Object.fromEntries(
  Object.entries(appSectionPaths).map(([section, path]) => [path, section])
) as Record<string, AppSection>

export const authPaths: Record<AuthMode, string> = {
  login: "/login",
  recover: "/recover",
  register: "/register",
}

export function getAppSectionPath(section: AppSection) {
  return appSectionPaths[section]
}

export function getAppSectionFromPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/$/, "") || "/"

  return appSectionsByPath[normalizedPath] ?? null
}
