"use client"

import { ArrowLeftIcon, KeyRoundIcon, ShieldCheckIcon } from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"
import { toast } from "sonner"

import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createSupabaseBrowser } from "@/lib/supabase/client"

type PasswordResetScreenProps = {
  email: string
  isRecovery?: boolean
  onBack: () => void
}

export function PasswordResetScreen({
  email,
  isRecovery = false,
  onBack,
}: PasswordResetScreenProps) {
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingRecoveryLink, setIsSendingRecoveryLink] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isRecovery && !currentPassword) {
      toast.error("Informe a senha atual.")
      return
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    if (password !== confirmation) {
      toast.error("As senhas não conferem.")
      return
    }

    if (!isRecovery && password === currentPassword) {
      toast.error("A nova senha deve ser diferente da senha atual.")
      return
    }

    setIsSubmitting(true)

    if (!isRecovery) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (signInError) {
        setIsSubmitting(false)
        toast.error("A senha atual está incorreta.")
        return
      }
    }

    const { error } = await supabase.auth.updateUser({ password })
    setIsSubmitting(false)

    if (error) {
      toast.error("Não foi possível atualizar a senha", {
        description: error.message,
      })
      return
    }

    toast.success("Senha atualizada com sucesso", {
      description: "Use a nova senha no próximo acesso.",
    })
    onBack()
  }

  async function handleSendRecoveryEmail() {
    try {
      setIsSendingRecoveryLink(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/alterar-senha`,
      })
      if (error) throw error
      toast.success("E-mail de recuperação enviado!", {
        description: "Confira sua caixa de entrada para redefinir sua senha.",
      })
    } catch (error) {
      toast.error("Não foi possível enviar o e-mail de recuperação", {
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
      })
    } finally {
      setIsSendingRecoveryLink(false)
    }
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
                {isRecovery ? (
                  <ShieldCheckIcon className="size-4" />
                ) : (
                  <KeyRoundIcon className="size-4" />
                )}
              </div>
              <div>
                <CardTitle className="font-heading text-lg font-bold">Redefinir senha</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isRecovery
                    ? "Defina uma nova senha para recuperar o acesso à sua conta."
                    : "Informe sua senha atual e escolha uma nova senha para sua conta."}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-0">
              <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                <FieldGroup className="gap-3">
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="reset-email">E-mail</FieldLabel>
                    <Input
                      aria-readonly="true"
                      className="h-9 cursor-not-allowed bg-muted/40 font-mono text-xs text-muted-foreground"
                      id="reset-email"
                      readOnly
                      value={email}
                    />
                  </Field>

                  {!isRecovery ? (
                    <Field className="gap-1.5">
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="current-password">Senha atual</FieldLabel>
                        <button
                          className="cursor-pointer text-[11px] text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                          disabled={isSendingRecoveryLink}
                          onClick={handleSendRecoveryEmail}
                          type="button"
                        >
                          {isSendingRecoveryLink ? "Enviando..." : "Esqueceu a senha atual?"}
                        </button>
                      </div>
                      <Input
                        autoComplete="current-password"
                        className="h-9"
                        id="current-password"
                        name="currentPassword"
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        placeholder="Digite sua senha atual"
                        type="password"
                        value={currentPassword}
                      />
                    </Field>
                  ) : null}

                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
                    <Input
                      autoComplete="new-password"
                      className="h-9"
                      id="new-password"
                      name="newPassword"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      type="password"
                      value={password}
                    />
                  </Field>

                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="confirm-password">Confirmar nova senha</FieldLabel>
                    <Input
                      autoComplete="new-password"
                      className="h-9"
                      id="confirm-password"
                      name="confirmPassword"
                      onChange={(event) => setConfirmation(event.target.value)}
                      placeholder="Repita a nova senha"
                      type="password"
                      value={confirmation}
                    />
                  </Field>
                </FieldGroup>

                <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button onClick={onBack} size="sm" type="button" variant="outline">
                    Cancelar
                  </Button>
                  <Button disabled={isSubmitting} size="sm" type="submit">
                    {isSubmitting ? "Salvando..." : "Atualizar senha"}
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
