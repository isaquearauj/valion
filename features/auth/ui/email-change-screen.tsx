"use client"

import { ArrowLeftIcon, MailIcon } from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"
import { toast } from "sonner"

import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createSupabaseBrowser } from "@/lib/supabase/client"

type EmailChangeScreenProps = {
  currentEmail: string
  onBack: () => void
}

export function EmailChangeScreen({ currentEmail, onBack }: EmailChangeScreenProps) {
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const [newEmail, setNewEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedEmail = newEmail.trim().toLowerCase()

    if (!trimmedEmail) {
      toast.error("Informe o novo endereço de e-mail.")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Formato de e-mail inválido.")
      return
    }

    if (trimmedEmail === currentEmail.toLowerCase()) {
      toast.error("O novo e-mail deve ser diferente do atual.")
      return
    }

    if (!password) {
      toast.error("Informe sua senha atual para autorizar a alteração.")
      return
    }

    setIsSubmitting(true)

    // 1. Valida a senha atual para garantir autenticidade da troca de e-mail
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password,
    })

    if (signInError) {
      setIsSubmitting(false)
      toast.error("A senha atual está incorreta.")
      return
    }

    // 2. Solicita atualização do e-mail no Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser(
      { email: trimmedEmail },
      { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    )
    setIsSubmitting(false)

    if (updateError) {
      toast.error("Não foi possível solicitar a alteração de e-mail", {
        description: updateError.message,
      })
      return
    }

    toast.success("Confirmação enviada!", {
      description:
        "Enviamos um link de confirmação para o novo e-mail. Acesse sua caixa de entrada para concluir a alteração.",
    })
    onBack()
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-3">
          <Brand />
          <Button
            aria-label="Voltar ao painel"
            className="h-8 gap-1.5 px-3 text-xs"
            onClick={onBack}
            type="button"
            variant="ghost"
          >
            <ArrowLeftIcon className="size-3.5" />
            Voltar ao painel
          </Button>
        </header>

        <section className="flex flex-1 items-center justify-center py-6">
          <Card className="w-full max-w-md border-border/80 shadow-xs">
            <CardHeader className="space-y-2 p-5 pb-3">
              <div className="inline-flex size-9 items-center justify-center rounded-xl bg-accent text-primary">
                <MailIcon className="size-4" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg font-bold">Alterar e-mail</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Informe o novo endereço de e-mail e sua senha de acesso para confirmar a
                  alteração.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-0">
              <form className="flex flex-col gap-3" noValidate onSubmit={handleSubmit}>
                <FieldGroup className="gap-3">
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="current-email">E-mail atual</FieldLabel>
                    <Input
                      aria-readonly="true"
                      className="h-9 cursor-not-allowed bg-muted/40 font-mono text-xs text-muted-foreground"
                      id="current-email"
                      readOnly
                      value={currentEmail}
                    />
                  </Field>

                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="new-email">Novo endereço de e-mail</FieldLabel>
                    <Input
                      autoComplete="email"
                      className="h-9"
                      id="new-email"
                      name="newEmail"
                      onChange={(event) => setNewEmail(event.target.value)}
                      placeholder="novo@exemplo.com"
                      type="email"
                      value={newEmail}
                    />
                  </Field>

                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="account-password">Senha atual</FieldLabel>
                    <Input
                      autoComplete="current-password"
                      className="h-9"
                      id="account-password"
                      name="password"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Digite sua senha de acesso"
                      type="password"
                      value={password}
                    />
                  </Field>
                </FieldGroup>

                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Enviaremos uma mensagem de confirmação para validar a alteração. Seu e-mail de
                  acesso só mudará após a validação do link.
                </p>

                <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button onClick={onBack} size="sm" type="button" variant="outline">
                    Cancelar
                  </Button>
                  <Button disabled={isSubmitting} size="sm" type="submit">
                    {isSubmitting ? "Solicitando..." : "Confirmar alteração"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
