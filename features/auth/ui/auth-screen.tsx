"use client"

import { ArrowRightIcon } from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"
import { toast } from "sonner"

import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getAppUserFromSupabaseUser } from "@/features/auth/supabase-user"
import type { AppUser } from "@/features/auth/types"
import type { AuthMode } from "@/features/navigation/routes"
import { createSupabaseBrowser } from "@/lib/supabase/client"

type AuthScreenProps = {
  onAuthenticate: (user: AppUser) => Promise<void> | void
  onModeChange?: (mode: AuthMode) => void
  mode?: AuthMode
}

const authCopy = {
  login: {
    action: "Entrar no painel",
    description: "Entre para acompanhar seu dinheiro com clareza.",
    title: "Bom ter você de volta",
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
    <main className="h-dvh w-full overflow-hidden bg-background text-foreground lg:grid lg:grid-cols-2">
      {/* Coluna Esquerda: Institucional / Branding (apenas desktop) */}
      <section className="relative hidden h-full flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground lg:flex xl:p-12">
        {/* Background sutil com círculos orgânicos suaves */}
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-white/[0.03] blur-2xl" />
        <div className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-emerald-400/[0.06] blur-3xl" />

        <div className="relative z-10">
          <Brand className="[&>span:first-child]:bg-white/15 [&>span:first-child]:text-white" />
        </div>

        <div className="relative z-10 my-auto mx-auto max-w-md py-6 text-left">
          <h1 className="font-heading text-3xl font-extrabold leading-snug tracking-tight text-white xl:text-[2.25rem]">
            Clareza absoluta para o seu dinheiro.
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-white/80 xl:text-base">
            Decisões financeiras inteligentes começam com um controle descomplicado e transparente.
          </p>
        </div>

        <div />
      </section>

      {/* Coluna Direita: Formulário de Autenticação */}
      <section className="flex h-full flex-col justify-between overflow-y-auto px-6 py-6 sm:px-10 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Brand />
          </div>
        </div>

        <div className="mx-auto my-auto w-full max-w-sm py-4">
          <div className="space-y-1.5 text-left">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {authCopy[activeMode].title}
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {authCopy[activeMode].description}
            </p>
          </div>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <FieldGroup className="gap-3.5">
              {activeMode === "register" ? (
                <Field className="gap-1.5">
                  <FieldLabel className="text-xs font-medium" htmlFor="name">
                    Nome
                  </FieldLabel>
                  <Input
                    autoComplete="name"
                    className="h-10 text-sm"
                    id="name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Como prefere ser chamado"
                    value={name}
                  />
                </Field>
              ) : null}

              <Field className="gap-1.5" data-invalid={Boolean(error)}>
                <FieldLabel className="text-xs font-medium" htmlFor="email">
                  E-mail
                </FieldLabel>
                <Input
                  autoComplete="email"
                  className="h-10 text-sm"
                  id="email"
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                  value={email}
                />
              </Field>

              {activeMode !== "recover" ? (
                <Field className="gap-1.5" data-invalid={Boolean(error)}>
                  <div className="flex items-center justify-between">
                    <FieldLabel className="text-xs font-medium" htmlFor="password">
                      Senha
                    </FieldLabel>
                    {activeMode === "login" ? (
                      <button
                        className="cursor-pointer text-xs font-medium text-muted-foreground transition-colors hover:text-primary hover:underline"
                        onClick={() => setActiveMode("recover")}
                        type="button"
                      >
                        Esqueci minha senha
                      </button>
                    ) : null}
                  </div>
                  <Input
                    autoComplete={activeMode === "register" ? "new-password" : "current-password"}
                    className="h-10 text-sm"
                    id="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    type="password"
                    value={password}
                  />
                </Field>
              ) : null}

              {error ? <FieldError className="text-xs">{error}</FieldError> : null}
            </FieldGroup>

            <Button
              className="mt-2 h-10 w-full font-medium"
              disabled={isSubmitting}
              size="lg"
              type="submit"
            >
              {isSubmitting ? "Aguarde..." : authCopy[activeMode].action}
              <ArrowRightIcon className="size-4 ml-1.5" />
            </Button>
          </form>

          {/* Rodapé Alternador de Modos */}
          <div className="mt-6 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground sm:text-sm">
            {activeMode === "login" ? (
              <p>
                Ainda não tem conta?{" "}
                <button
                  className="cursor-pointer font-semibold text-primary underline-offset-4 hover:underline"
                  onClick={() => setActiveMode("register")}
                  type="button"
                >
                  Criar uma conta
                </button>
              </p>
            ) : (
              <p>
                Já possui uma conta?{" "}
                <button
                  className="cursor-pointer font-semibold text-primary underline-offset-4 hover:underline"
                  onClick={() => setActiveMode("login")}
                  type="button"
                >
                  Entrar no painel
                </button>
              </p>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Valion
        </div>
      </section>
    </main>
  )
}
