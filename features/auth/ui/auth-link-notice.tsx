"use client"

import { useEffect } from "react"
import { toast } from "sonner"

const EMAIL_CHANGE_PARTIAL_MESSAGE = "confirmation link accepted"

/**
 * O Supabase Auth devolve alguns avisos no fragmento da URL (`#message=...` ou `#error=...`),
 * em inglês. Este componente traduz os casos conhecidos para toasts em pt-BR e limpa o fragmento.
 * O texto original nunca é exibido nem registrado.
 */
export function AuthLinkNotice() {
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return

    const params = new URLSearchParams(hash)
    const message = params.get("message")
    const error = params.get("error") ?? params.get("error_code")

    if (message?.toLowerCase().includes(EMAIL_CHANGE_PARTIAL_MESSAGE)) {
      toast.success("Primeira confirmação recebida", {
        description:
          "Para concluir a alteração, abra também o link enviado para o outro endereço de e-mail.",
        duration: 10000,
      })
    } else if (error) {
      const isExpired = params.get("error_code") === "otp_expired"
      toast.error(isExpired ? "Link expirado ou já utilizado" : "Não foi possível validar o link", {
        description: "Solicite um novo e-mail e tente novamente.",
      })
    } else {
      return
    }

    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}`,
    )
  }, [])

  return null
}
