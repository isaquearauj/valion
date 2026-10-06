"use client"

import {
  CameraIcon,
  ChevronRightIcon,
  KeyRoundIcon,
  LogOutIcon,
  MailIcon,
  ShieldIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { validateAvatarFile } from "@/features/auth/profile-repository"
import type { AppUser, ProfileUpdate } from "@/features/auth/types"
import { getInitials } from "@/features/finance/presentation/dashboard-view-models"
import { getActionErrorMessage } from "@/features/finance/ui/shared/dashboard-primitives"
import { cn } from "@/lib/utils"

export function AccountDialog({
  onDeleteAccount,
  onLogout,
  onOpenChange,
  onRequestEmailChange,
  onRequestPasswordReset,
  onUpdateUser,
  open,
  user,
}: {
  onDeleteAccount: () => Promise<void> | void
  onLogout: () => Promise<void> | void
  onOpenChange: (open: boolean) => void
  onRequestEmailChange?: () => void
  onRequestPasswordReset: () => void
  onUpdateEmail?: (newEmail: string) => Promise<void>
  onUpdateUser: (update: ProfileUpdate) => Promise<void> | void
  open: boolean
  user: AppUser
}) {
  const [draftName, setDraftName] = useState(user.name)
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(user.avatarUrl ?? "")
  const [draftAvatarFile, setDraftAvatarFile] = useState<File | undefined>()
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [nameError, setNameError] = useState("")

  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile")

  const [lastOpen, setLastOpen] = useState(open)

  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setActiveTab("profile")
      setDraftName(user.name)
      setDraftAvatarUrl(user.avatarUrl ?? "")
      setDraftAvatarFile(undefined)
      setRemoveAvatar(false)
      setNameError("")
    }
  }

  useEffect(() => {
    return () => {
      if (draftAvatarUrl.startsWith("blob:")) URL.revokeObjectURL(draftAvatarUrl)
    }
  }, [draftAvatarUrl])

  function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""

    if (!file) return

    try {
      validateAvatarFile(file)
    } catch (error) {
      toast.error(getActionErrorMessage(error))
      return
    }

    if (draftAvatarUrl.startsWith("blob:")) URL.revokeObjectURL(draftAvatarUrl)
    setDraftAvatarFile(file)
    setDraftAvatarUrl(URL.createObjectURL(file))
    setRemoveAvatar(false)
  }

  function handleRemoveAvatar() {
    if (draftAvatarUrl.startsWith("blob:")) URL.revokeObjectURL(draftAvatarUrl)
    setDraftAvatarFile(undefined)
    setDraftAvatarUrl("")
    setRemoveAvatar(true)
  }

  async function handleSubmitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextName = String(new FormData(event.currentTarget).get("name") ?? "").trim()

    if (!nextName) {
      setNameError("Informe um nome.")
      return
    }

    setNameError("")

    try {
      setIsSavingProfile(true)
      await onUpdateUser({
        avatarFile: draftAvatarFile,
        name: nextName,
        removeAvatar,
      })
      toast.success("Perfil atualizado com sucesso")
      onOpenChange(false)
    } catch (error) {
      toast.error("Não foi possível atualizar o perfil", {
        description: getActionErrorMessage(error),
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleConfirmDelete() {
    setIsDeleting(true)
    try {
      await onDeleteAccount()
      setIsDeleteConfirmOpen(false)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold">Meu perfil</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Gerencie seus dados pessoais e preferências de segurança da conta.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            className="w-full"
            onValueChange={(val) => {
              if (val) setActiveTab(val as "profile" | "security")
            }}
            value={activeTab}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                className={cn(
                  activeTab === "profile" &&
                    "border-border/80 bg-card font-bold text-primary shadow-xs",
                )}
                value="profile"
              >
                <UserIcon
                  className={cn(
                    "size-4 transition-colors",
                    activeTab === "profile" ? "text-primary" : "text-muted-foreground",
                  )}
                />
                Perfil
              </TabsTrigger>
              <TabsTrigger
                className={cn(
                  activeTab === "security" &&
                    "border-border/80 bg-card font-bold text-primary shadow-xs",
                )}
                value="security"
              >
                <ShieldIcon
                  className={cn(
                    "size-4 transition-colors",
                    activeTab === "security" ? "text-primary" : "text-muted-foreground",
                  )}
                />
                Segurança
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: PERFIL */}
            <TabsContent className="mt-2 space-y-5" value="profile">
              <form className="space-y-5" onSubmit={handleSubmitProfile}>
                {/* Avatar elegante centralizado */}
                <div className="flex flex-col items-center justify-center gap-2.5 py-1">
                  <div className="group relative">
                    <Avatar className="size-20 border-2 border-border shadow-2xs">
                      {draftAvatarUrl ? (
                        <AvatarImage alt={draftName.trim() || user.name} src={draftAvatarUrl} />
                      ) : null}
                      <AvatarFallback className="bg-accent font-heading text-lg font-bold text-primary">
                        {getInitials(draftName.trim() || user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute -right-1 -bottom-1 flex size-7 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-2xs transition hover:bg-muted hover:text-primary focus-within:ring-2 focus-within:ring-ring">
                      <CameraIcon className="size-3.5" />
                      <span className="sr-only">Alterar foto de perfil</span>
                      <input
                        accept="image/*"
                        className="sr-only"
                        onChange={handleProfilePhotoChange}
                        type="file"
                      />
                    </label>
                  </div>
                  {draftAvatarUrl ? (
                    <button
                      className="cursor-pointer text-xs text-muted-foreground underline-offset-4 transition hover:text-destructive hover:underline"
                      onClick={handleRemoveAvatar}
                      type="button"
                    >
                      Remover foto
                    </button>
                  ) : null}
                </div>

                <FieldGroup className="space-y-4">
                  <Field data-invalid={Boolean(nameError)}>
                    <FieldLabel htmlFor="profile-name">Nome</FieldLabel>
                    <Input
                      aria-describedby={nameError ? "profile-name-error" : undefined}
                      aria-invalid={Boolean(nameError)}
                      autoComplete="name"
                      id="profile-name"
                      name="name"
                      onChange={(event) => {
                        setDraftName(event.target.value)
                        if (nameError) setNameError("")
                      }}
                      placeholder="Digite seu nome"
                      value={draftName}
                    />
                    <FieldError id="profile-name-error">{nameError}</FieldError>
                  </Field>

                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="profile-email-info">E-mail de acesso</FieldLabel>
                      <span className="text-[11px] text-muted-foreground">
                        Altere na aba Segurança
                      </span>
                    </div>
                    <Input
                      aria-readonly="true"
                      className="cursor-not-allowed bg-muted/40 font-mono text-xs text-muted-foreground"
                      id="profile-email-info"
                      readOnly
                      value={user.email}
                    />
                  </Field>
                </FieldGroup>

                <DialogFooter className="mt-4 pt-3 border-t border-border/40">
                  <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                    Cancelar
                  </Button>
                  <Button disabled={isSavingProfile} type="submit">
                    {isSavingProfile ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            {/* ABA 2: SEGURANÇA */}
            <TabsContent className="mt-2 space-y-4" value="security">
              <div className="space-y-3">
                {/* Bloco de E-mail da Conta */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                      <MailIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">E-mail da conta</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    aria-label="Alterar e-mail"
                    className="h-8 gap-1.5 px-2.5 text-xs shrink-0"
                    onClick={() => {
                      onOpenChange(false)
                      onRequestEmailChange?.()
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Alterar e-mail
                  </Button>
                </div>

                {/* Bloco de Alteração de Senha */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                      <KeyRoundIcon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Senha de acesso</p>
                      <p className="text-xs text-muted-foreground">
                        Redefina ou altere sua senha de acesso
                      </p>
                    </div>
                  </div>
                  <Button
                    className="h-8 gap-1.5 px-2.5 text-xs"
                    onClick={() => {
                      onOpenChange(false)
                      onRequestPasswordReset()
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Alterar senha
                  </Button>
                </div>

                {/* Bloco de Sessão (Sair) */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <LogOutIcon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Sessão ativa</p>
                      <p className="text-xs text-muted-foreground">
                        Desconectar sua conta deste navegador
                      </p>
                    </div>
                  </div>
                  <Button
                    className="h-8 gap-1.5 px-2.5 text-xs hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30"
                    onClick={onLogout}
                    size="sm"
                    variant="ghost"
                  >
                    Sair
                  </Button>
                </div>

                <Separator className="my-2" />

                {/* Zona de Perigo Discreta */}
                <div className="pt-1">
                  <button
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2Icon className="size-3.5 text-destructive/80" />
                      Excluir conta permanentemente
                    </span>
                    <ChevronRightIcon className="size-3.5 opacity-60" />
                  </button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão usando nosso ConfirmDialog padronizado */}
      <ConfirmDialog
        cancelText="Voltar"
        confirmText="Excluir conta definitivamente"
        description="Esta ação é permanente e irreversível. Todos os seus registros financeiros, metas, histórico e dados pessoais serão excluídos definitivamente."
        destructive
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onOpenChange={setIsDeleteConfirmOpen}
        open={isDeleteConfirmOpen}
        title="Excluir sua conta?"
      />
    </>
  )
}
