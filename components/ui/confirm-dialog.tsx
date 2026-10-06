"use client"

import { AlertTriangleIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type ConfirmDialogProps = {
  cancelText?: string
  confirmText?: string
  description?: string
  destructive?: boolean
  icon?: "trash" | "warning" | "none"
  isLoading?: boolean
  isPending?: boolean
  onConfirm: () => void | Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
}

export function ConfirmDialog({
  cancelText = "Cancelar",
  confirmText = "Confirmar",
  description,
  destructive = false,
  icon = destructive ? "trash" : "warning",
  isLoading = false,
  isPending: isPendingProp = false,
  onConfirm,
  onOpenChange,
  open,
  title,
}: ConfirmDialogProps) {
  const [internalPending, setInternalPending] = useState(false)

  async function handleConfirm() {
    try {
      setInternalPending(true)
      await onConfirm()
      onOpenChange(false)
    } catch {
      // O erro é tratado externamente via toast
    } finally {
      setInternalPending(false)
    }
  }

  const busy = isLoading || isPendingProp || internalPending

  return (
    <Dialog onOpenChange={(next) => !busy && onOpenChange(next)} open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton={!busy}>
        <DialogHeader className="flex flex-col gap-3">
          {icon !== "none" ? (
            <div
              className={`flex size-11 items-center justify-center rounded-xl ${
                destructive
                  ? "bg-destructive/10 text-destructive"
                  : "bg-finance-warning-soft text-finance-warning"
              }`}
            >
              {icon === "trash" ? (
                <Trash2Icon className="size-5" />
              ) : (
                <AlertTriangleIcon className="size-5" />
              )}
            </div>
          ) : null}
          <div>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription className="mt-1.5 leading-normal">{description}</DialogDescription>
            ) : null}
          </div>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button
            disabled={busy}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {cancelText}
          </Button>
          <Button
            disabled={busy}
            onClick={handleConfirm}
            type="button"
            variant={destructive ? "destructive" : "default"}
          >
            {busy ? "Aguarde..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
