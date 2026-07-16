"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ConfirmDialog({
  confirmLabel = "Confirmar",
  description,
  isPending = false,
  onConfirm,
  onOpenChange,
  open,
  title,
}: {
  confirmLabel?: string
  description: string
  isPending?: boolean
  onConfirm: () => Promise<void> | void
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
}) {
  return (
    <Dialog onOpenChange={isPending ? undefined : onOpenChange} open={open}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={isPending} onClick={() => onOpenChange(false)} variant="outline">
            Cancelar
          </Button>
          <Button disabled={isPending} onClick={() => void onConfirm()} variant="destructive">
            {isPending ? "Aguarde..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
