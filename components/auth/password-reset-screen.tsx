"use client"

import { ArrowLeftIcon, KeyRoundIcon, MailIcon, ShieldCheckIcon } from "lucide-react"
import { toast } from "sonner"
import { type FormEvent, useMemo, useState } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createSupabaseBrowser } from "@/lib/supabase/client"

type PasswordResetScreenProps = {
  email: string
  onBack: () => void
}

export function PasswordResetScreen({ email, onBack }: PasswordResetScreenProps) {
  const supabase = useMemo(() => createSupabaseBrowser(), [])
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    if (password !== confirmation) {
      toast.error("As senhas não conferem.")
      return
    }

    setIsSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setIsSubmitting(false)

    if (error) {
      toast.error("Não foi possível atualizar a senha", {
        description: error.message,
      })
      return
    }

    toast.success("Senha atualizada", {
      description: "Use a nova senha no próximo acesso.",
    })
    onBack()
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheckIcon />
            </div>
            <div>
              <p className="font-heading text-base font-semibold">Valion</p>
              <p className="text-xs text-muted-foreground">Segurança da conta</p>
            </div>
          </div>
          <ThemeToggle size="small" />
        </header>

        <section className="flex flex-1 items-center justify-center py-8">
          <Card className="w-full max-w-xl border-foreground/10 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur">
            <CardHeader className="space-y-3">
              <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <KeyRoundIcon />
              </div>
              <div>
                <CardTitle className="text-2xl">Redefinir senha</CardTitle>
                <CardDescription className="mt-2">
                  Solicite um link para alterar a senha da sua conta.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="reset-email">E-mail</FieldLabel>
                    <Input
                      id="reset-email"
                      readOnly
                      value={email}
                      className="bg-muted/50 text-muted-foreground"
                    />
                    <FieldDescription>
                      A nova senha será aplicada para esta conta.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
                    <Input
                      autoComplete="new-password"
                      id="new-password"
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      value={password}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">Confirmar nova senha</FieldLabel>
                    <Input
                      autoComplete="new-password"
                      id="confirm-password"
                      onChange={(event) => setConfirmation(event.target.value)}
                      type="password"
                      value={confirmation}
                    />
                  </Field>
                </FieldGroup>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <Button onClick={onBack} type="button" variant="ghost">
                    <ArrowLeftIcon data-icon="inline-start" />
                    Voltar
                  </Button>
                  <Button disabled={isSubmitting} type="submit">
                    <MailIcon data-icon="inline-start" />
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
