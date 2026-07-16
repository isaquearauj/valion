"use client"

import {
  BanknoteArrowUpIcon,
  BarChart3Icon,
  ChevronRightIcon,
  CreditCardIcon,
  LineChartIcon,
  LogOutIcon,
  MenuIcon,
  PiggyBankIcon,
  SettingsIcon,
  TargetIcon,
} from "lucide-react"
import { type ComponentType, useState } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { AppUser } from "@/features/auth/types"
import { getInitials } from "@/features/finance/presentation/dashboard-view-models"
import type { AppSection } from "@/features/navigation/routes"
import { cn } from "@/lib/utils"

type SectionId = AppSection

export const financeSections = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3Icon },
  { id: "incomes", label: "Receitas", icon: BanknoteArrowUpIcon },
  { id: "expenses", label: "Despesas", icon: CreditCardIcon },
  { id: "investments", label: "Investimentos", icon: PiggyBankIcon },
  { id: "goals", label: "Metas", icon: TargetIcon },
  { id: "history", label: "Histórico", icon: LineChartIcon },
] as const satisfies ReadonlyArray<{
  id: SectionId
  label: string
  icon: ComponentType
}>

export function AppSidebar({
  activeSection,
  isPending,
  onOpenAccount,
  onSelectSection,
  user,
}: {
  activeSection: SectionId
  isPending: boolean
  onOpenAccount: () => void
  onSelectSection: (section: SectionId) => void
  user: AppUser
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh border-r bg-sidebar/95 px-3 py-4 text-sidebar-foreground backdrop-blur lg:flex lg:flex-col">
      <div className="px-2 pb-2 pt-1 text-center">
        <h1 className="font-heading text-[0.78rem] font-semibold uppercase tracking-[0.48em] text-sidebar-foreground/90">
          VALION
        </h1>
      </div>

      <nav className="mt-7 flex flex-col gap-1" aria-label="Navegação principal">
        {financeSections.map((section) => (
          <button
            aria-current={activeSection === section.id ? "page" : undefined}
            className={cn(
              "flex h-10 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              activeSection === section.id &&
                "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
            )}
            disabled={isPending}
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            type="button"
          >
            <section.icon />
            {section.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <button
          aria-label="Abrir conta e sessão"
          className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border bg-background/70 px-2 py-2 text-left shadow-none transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={onOpenAccount}
          type="button"
        >
          <Avatar className="size-7">
            {user.avatarUrl ? <AvatarImage alt={user.name} src={user.avatarUrl} /> : null}
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
          </div>
          <ChevronRightIcon className="text-muted-foreground" />
        </button>
      </div>
    </aside>
  )
}

export function TopBar({
  activeSection,
  onLogout,
  onOpenAccount,
  onSelectSection,
  user,
}: {
  activeSection: SectionId
  onLogout: () => Promise<void> | void
  onOpenAccount: () => void
  onSelectSection: (section: SectionId) => void
  user: AppUser
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  function handleSelectSection(section: SectionId) {
    setIsMobileNavOpen(false)
    onSelectSection(section)
  }

  function handleOpenAccount() {
    setIsMobileNavOpen(false)
    onOpenAccount()
  }

  return (
    <header className="sticky relative top-0 z-30 border-b bg-background/82 backdrop-blur-xl">
      <div className="relative flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Sheet onOpenChange={setIsMobileNavOpen} open={isMobileNavOpen}>
            <SheetTrigger render={<Button className="lg:hidden" size="icon" variant="outline" />}>
              <MenuIcon />
              <span className="sr-only">Abrir menu</span>
            </SheetTrigger>
            <SheetContent className="w-[21rem]" side="left">
              <SheetHeader>
                <SheetTitle>Valion</SheetTitle>
                <SheetDescription>Navegue pelas áreas financeiras.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="Navegação mobile">
                {financeSections.map((section) => (
                  <Button
                    className="justify-start"
                    key={section.id}
                    onClick={() => handleSelectSection(section.id)}
                    variant={activeSection === section.id ? "secondary" : "ghost"}
                  >
                    <section.icon data-icon="inline-start" />
                    {section.label}
                  </Button>
                ))}
              </nav>
              <SheetFooter>
                <button
                  aria-label="Abrir conta e sessão"
                  className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border bg-background/70 px-2 py-2 text-left shadow-none transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={handleOpenAccount}
                  type="button"
                >
                  <Avatar className="size-7">
                    {user.avatarUrl ? <AvatarImage alt={user.name} src={user.avatarUrl} /> : null}
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                  </div>
                  <SettingsIcon className="text-muted-foreground" />
                </button>
                <Button onClick={onLogout} variant="outline">
                  <LogOutIcon className="text-destructive" data-icon="inline-start" />
                  Sair
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">Olá, {user.name}</p>
            <h1 className="truncate font-heading text-lg font-semibold sm:text-xl">
              {financeSections.find((section) => section.id === activeSection)?.label}
            </h1>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button className="hidden sm:inline-flex" onClick={onLogout} variant="outline">
            <LogOutIcon className="text-destructive" data-icon="inline-start" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}
