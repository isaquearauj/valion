"use client"

import { ArrowLeftIcon, KeyRoundIcon, MailIcon, ShieldCheckIcon } from "lucide-react"
import { toast } from "sonner"
import { type FormEvent } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type PasswordResetScreenProps = {
  email: string
  onBack: () => void
}

export function PasswordResetScreen({ email, onBack }: PasswordResetScreenProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    toast.success("Link de redefinição solicitado", {
      description: `As instruções serão enviadas para ${email}.`,
    })
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
                      Usaremos este endereço para enviar o link de redefinição.
                    </FieldDescription>
                  </Field>
                </FieldGroup>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <Button onClick={onBack} type="button" variant="ghost">
                    <ArrowLeftIcon data-icon="inline-start" />
                    Voltar
                  </Button>
                  <Button type="submit">
                    <MailIcon data-icon="inline-start" />
                    Enviar link
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
