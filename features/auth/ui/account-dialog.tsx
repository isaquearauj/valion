"use client"

import { CameraIcon, KeyRoundIcon, LogOutIcon, Trash2Icon, XIcon } from "lucide-react"
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react"
import { toast } from "sonner"

import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { validateAvatarFile } from "@/features/auth/profile-repository"
import type { AppUser, ProfileUpdate } from "@/features/auth/types"
import { getInitials } from "@/features/finance/presentation/dashboard-view-models"
import { getActionErrorMessage } from "@/features/finance/ui/shared/dashboard-primitives"

export function AccountDialog({
  onDeleteAccount,
  onLogout,
  onOpenChange,
  onRequestPasswordReset,
  onUpdateUser,
  open,
  user,
}: {
  onDeleteAccount: () => Promise<void> | void
  onLogout: () => Promise<void> | void
  onOpenChange: (open: boolean) => void
  onRequestPasswordReset: () => void
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
  const [lastOpen, setLastOpen] = useState(open)

  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
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

    if (!file) {
      return
    }

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      toast.success("Perfil atualizado")
      onOpenChange(false)
    } catch (error) {
      toast.error("Não foi possível atualizar o perfil", {
        description: getActionErrorMessage(error),
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-hidden p-0 sm:max-w-md"
        showCloseButton={false}
      >
        <form
          className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
            <DialogTitle className="text-lg">Meu perfil</DialogTitle>
            <div className="flex items-center gap-1">
              <ThemeToggle size="small" />
              <DialogClose render={<Button aria-label="Fechar" size="icon-sm" variant="ghost" />}>
                <XIcon />
                <span className="sr-only">Fechar</span>
              </DialogClose>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <Avatar className="size-24">
                    {draftAvatarUrl ? (
                      <AvatarImage alt={draftName.trim() || user.name} src={draftAvatarUrl} />
                    ) : null}
                    <AvatarFallback className="text-xl">
                      {getInitials(draftName.trim() || user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute -right-1 -bottom-1 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted focus-within:ring-3 focus-within:ring-ring/50">
                    <CameraIcon />
                    <span className="sr-only">Alterar foto de perfil</span>
                    <input
                      accept="image/*"
                      className="sr-only"
                      onChange={handleProfilePhotoChange}
                      type="file"
                    />
                  </label>
                </div>

                <div>
                  <p className="text-base font-semibold">{draftName.trim() || user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                {draftAvatarUrl ? (
                  <Button
                    onClick={() => {
                      if (draftAvatarUrl.startsWith("blob:")) URL.revokeObjectURL(draftAvatarUrl)
                      setDraftAvatarFile(undefined)
                      setDraftAvatarUrl("")
                      setRemoveAvatar(true)
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Remover foto
                  </Button>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Informações pessoais</p>
                  <FieldGroup>
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
                      <FieldLabel htmlFor="profile-email">E-mail</FieldLabel>
                      <Input
                        aria-readonly="true"
                        className="bg-muted/50 text-muted-foreground"
                        id="profile-email"
                        readOnly
                        value={user.email}
                      />
                    </Field>
                  </FieldGroup>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Segurança</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="flex-1 justify-center"
                      onClick={onRequestPasswordReset}
                      type="button"
                      variant="outline"
                    >
                      <KeyRoundIcon data-icon="inline-start" />
                      Alterar senha
                    </Button>
                    <Button
                      className="flex-1 justify-center"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      type="button"
                      variant="destructive"
                    >
                      <Trash2Icon data-icon="inline-start" />
                      Excluir conta
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                className="justify-start"
                onClick={onLogout}
                type="button"
                variant="destructive"
              >
                <LogOutIcon data-icon="inline-start" />
                Sair
              </Button>

              <div className="flex gap-2 sm:justify-end">
                <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                  Cancelar
                </Button>
                <Button disabled={isSavingProfile} type="submit">
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>

      <Dialog onOpenChange={setIsDeleteConfirmOpen} open={isDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir conta?</DialogTitle>
            <DialogDescription>
              Essa ação remove permanentemente sua conta e todos os dados salvos no Valion.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setIsDeleteConfirmOpen(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true)
                try {
                  await onDeleteAccount()
                  setIsDeleteConfirmOpen(false)
                  onOpenChange(false)
                } finally {
                  setIsDeleting(false)
                }
              }}
              type="button"
              variant="destructive"
            >
              Excluir conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
