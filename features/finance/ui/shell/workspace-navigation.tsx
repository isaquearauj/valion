"use client"

import {
  BanknoteArrowUpIcon,
  BarChart3Icon,
  CreditCardIcon,
  LineChartIcon,
  LogOutIcon,
  MenuIcon,
  PiggyBankIcon,
  SettingsIcon,
  TargetIcon,
} from "lucide-react"
import Link from "next/link"
import { type ComponentType, useState } from "react"

import { Brand } from "@/components/brand"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AppTooltip } from "@/components/ui/tooltip"
import type { AppUser } from "@/features/auth/types"
import { getInitials } from "@/features/finance/presentation/dashboard-view-models"
import { type AppSection, getAppSectionPath } from "@/features/navigation/routes"
import { cn } from "@/lib/utils"

type SectionId = AppSection

export const financeSections = [
  { id: "dashboard", label: "Visão Geral", icon: BarChart3Icon },
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
  onOpenAccount: _onOpenAccount,
  onSelectSection,
  user: _user,
}: {
  activeSection: SectionId
  isPending?: boolean
  onOpenAccount?: () => void
  onSelectSection?: (section: SectionId) => void
  user?: AppUser
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh border-r border-sidebar-border bg-sidebar px-4 py-7 text-sidebar-foreground lg:flex lg:flex-col">
      <div className="px-2 pb-2">
        <Brand subtitle="Seu dinheiro, mais claro." />
        <p className="mt-8 px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Navegação
        </p>
      </div>

      <nav className="mt-2 flex flex-col gap-1" aria-label="Navegação principal">
        {financeSections.map((section) => {
          const href = getAppSectionPath(section.id)
          const isActive = activeSection === section.id

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-[18px]",
                isActive && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
                isPending && "pointer-events-none opacity-60",
              )}
              href={href}
              key={section.id}
              onClick={() => onSelectSection?.(section.id)}
              prefetch
            >
              <section.icon />
              {section.label}
            </Link>
          )
        })}
      </nav>
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
  onSelectSection?: (section: SectionId) => void
  user: AppUser
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  function handleOpenAccount() {
    setIsMobileNavOpen(false)
    onOpenAccount()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Sheet onOpenChange={setIsMobileNavOpen} open={isMobileNavOpen}>
            <SheetTrigger render={<Button className="lg:hidden" size="icon" variant="outline" />}>
              <MenuIcon />
              <span className="sr-only">Abrir menu</span>
            </SheetTrigger>
            <SheetContent className="w-[min(21rem,calc(100vw-1rem))]" side="left">
              <SheetHeader>
                <SheetTitle>
                  <Brand />
                </SheetTitle>
                <SheetDescription>Navegue pelas áreas financeiras.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="Navegação mobile">
                {financeSections.map((section) => {
                  const href = getAppSectionPath(section.id)
                  const isActive = activeSection === section.id

                  return (
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                        "justify-start",
                      )}
                      href={href}
                      key={section.id}
                      onClick={() => {
                        setIsMobileNavOpen(false)
                        onSelectSection?.(section.id)
                      }}
                      prefetch
                    >
                      <section.icon data-icon="inline-start" />
                      {section.label}
                    </Link>
                  )
                })}
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
          <div className="lg:hidden">
            <Brand className="text-lg [&>span:first-child]:size-8" />
          </div>
          <h1 className="sr-only lg:hidden">
            {financeSections.find((section) => section.id === activeSection)?.label}
          </h1>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-xs text-muted-foreground">Olá, {user.name.split(" ")[0]}</p>
            <h1 className="truncate font-heading text-lg font-bold tracking-tight sm:text-xl">
              {financeSections.find((section) => section.id === activeSection)?.label}
            </h1>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <AppTooltip content="Minha conta e perfil" side="bottom">
            <button
              aria-label="Abrir meu perfil"
              className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={onOpenAccount}
              type="button"
            >
              <Avatar className="size-8">
                {user.avatarUrl ? <AvatarImage alt={user.name} src={user.avatarUrl} /> : null}
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </button>
          </AppTooltip>
        </div>
      </div>
    </header>
  )
}
