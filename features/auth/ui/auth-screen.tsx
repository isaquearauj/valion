"use client"

import {
  ArrowRightIcon,
  ChartNoAxesCombinedIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
  WalletCardsIcon,
} from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"
import { toast } from "sonner"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { getAppUserFromSupabaseUser } from "@/features/auth/supabase-user"
import type { AppUser } from "@/features/auth/types"
import type { AuthMode } from "@/features/navigation/routes"
import { createSupabaseBrowser } from "@/lib/supabase/client"

type AuthScreenProps = {
  onAuthenticate: (user: AppUser) => Promise<void> | void
  onModeChange?: (mode: AuthMode) => void
  mode?: AuthMode
}

const benefits = [
  {
    description: "Receitas, compromissos e investimentos no mesmo painel.",
    icon: WalletCardsIcon,
    title: "Visão financeira única",
  },
  {
    description: "Arquitetura preparada para autenticação, RLS e variáveis de ambiente.",
    icon: ShieldCheckIcon,
    title: "Pronto para produção",
  },
  {
    description: "Gráficos, histórico mensal e indicadores de orçamento comprometido.",
    icon: ChartNoAxesCombinedIcon,
    title: "Decisão baseada em dados",
  },
]

const authCopy = {
  login: {
    action: "Entrar no painel",
    description: "Acesse sua central financeira com e-mail e senha.",
    title: "Acesse sua central financeira",
  },
  recover: {
    action: "Enviar instruções",
    description: "Receba as instruções para redefinir sua senha.",
    title: "Recuperar senha",
  },
  register: {
    action: "Criar conta",
    description: "Crie sua conta para organizar sua vida financeira.",
    title: "Crie sua conta",
  },
} satisfies Record<AuthMode, { action: string; description: string; title: string }>

export function AuthScreen({ mode, onAuthenticate, onModeChange }: AuthScreenProps) {
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const [internalMode, setInternalMode] = useState<AuthMode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const activeMode = mode ?? internalMode
  const setActiveMode = onModeChange ?? setInternalMode

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!email.includes("@")) {
      setError("Informe um e-mail válido para continuar.")
      return
    }

    if (activeMode === "recover") {
      setIsSubmitting(true)

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/alterar-senha`,
      })

      setIsSubmitting(false)

      if (resetError) {
        setError(resetError.message)
        return
      }

      toast.success("Instruções enviadas", {
        description: "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.",
      })
      setActiveMode("login")
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setIsSubmitting(true)

    if (activeMode === "register") {
      const fallbackName = email.split("@")[0]?.replace(/[._-]/g, " ") || "Usuário"
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        options: {
          data: {
            full_name: name.trim() || fallbackName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
        password,
      })

      setIsSubmitting(false)

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (!data.user || !data.session) {
        toast.success("Conta criada", {
          description: "Confira seu e-mail para confirmar a conta antes de entrar.",
        })
        setActiveMode("login")
        return
      }

      const appUser = await getAppUserFromSupabaseUser(supabase, data.user)
      toast.success("Conta criada", {
        description: "Bem-vindo ao Valion.",
      })
      await onAuthenticate(appUser)
      return
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsSubmitting(false)

    if (signInError || !data.user) {
      const message = signInError?.message.toLowerCase() ?? ""
      setError(
        message.includes("confirm")
          ? "Confirme seu e-mail antes de entrar."
          : "E-mail ou senha inválidos.",
      )
      return
    }

    const appUser = await getAppUserFromSupabaseUser(supabase, data.user)

    toast.success("Sessão iniciada", {
      description: "Bem-vindo ao Valion.",
    })
    await onAuthenticate(appUser)
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,var(--brand-soft),transparent_32rem),linear-gradient(135deg,var(--background),var(--muted))]" />
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <WalletCardsIcon />
            </div>
            <div>
              <p className="font-heading text-base font-semibold">Valion</p>
              <p className="text-xs text-muted-foreground">Finanças pessoais premium</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-12">
          <div className="flex flex-col gap-8">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
                <LockKeyholeIcon />
                Plataforma financeira pronta para evoluir
              </div>
              <h1 className="max-w-3xl text-balance font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Controle financeiro pessoal com clareza de produto SaaS.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                Organize receitas, despesas fixas, parcelamentos e investimentos em uma plataforma
                moderna, responsiva e preparada para produção.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="bg-card/80 shadow-sm backdrop-blur">
                  <CardHeader className="gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <benefit.icon />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{benefit.title}</CardTitle>
                      <CardDescription className="mt-1 text-xs leading-5">
                        {benefit.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <Card className="mx-auto w-full max-w-md border-foreground/10 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">{authCopy[activeMode].title}</CardTitle>
              <CardDescription>{authCopy[activeMode].description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <FieldGroup>
                  {activeMode === "register" ? (
                    <Field>
                      <FieldLabel htmlFor="name">Nome</FieldLabel>
                      <Input
                        autoComplete="name"
                        id="name"
                        onChange={(event) => setName(event.target.value)}
                        value={name}
                      />
                    </Field>
                  ) : null}

                  <Field data-invalid={Boolean(error)}>
                    <FieldLabel htmlFor="email">E-mail</FieldLabel>
                    <Input
                      autoComplete="email"
                      id="email"
                      inputMode="email"
                      onChange={(event) => setEmail(event.target.value)}
                      value={email}
                    />
                    {activeMode === "login" ? (
                      <FieldDescription>Use seu e-mail para acessar o painel.</FieldDescription>
                    ) : null}
                  </Field>

                  {activeMode !== "recover" ? (
                    <Field data-invalid={Boolean(error)}>
                      <FieldLabel htmlFor="password">Senha</FieldLabel>
                      <Input
                        autoComplete={
                          activeMode === "register" ? "new-password" : "current-password"
                        }
                        id="password"
                        onChange={(event) => setPassword(event.target.value)}
                        type="password"
                        value={password}
                      />
                    </Field>
                  ) : null}

                  <FieldError>{error}</FieldError>
                </FieldGroup>

                <Button className="h-10" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Aguarde..." : authCopy[activeMode].action}
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              </form>

              <Separator className="my-5" />

              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                {activeMode !== "login" ? (
                  <Button onClick={() => setActiveMode("login")} type="button" variant="link">
                    Já tenho conta
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => setActiveMode("register")} type="button" variant="link">
                      Criar uma conta
                    </Button>
                    <Button onClick={() => setActiveMode("recover")} type="button" variant="link">
                      Esqueci minha senha
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
