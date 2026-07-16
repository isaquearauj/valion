"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  KeyRoundIcon,
  LogOutIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { AppUser } from "@/features/auth/types"
import { getCurrentMonthKey } from "@/features/finance/domain/initial-data"
import {
  type ChargeReminder,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  type ExpenseCategory,
  type ExpenseStatus,
  type FixedExpense,
  GOAL_STATUSES,
  type Goal,
  type GoalContribution,
  INCOME_FREQUENCIES,
  INCOME_TYPES,
  type Income,
  type IncomeFrequency,
  type IncomeType,
  type InvestmentEntry,
  REMINDER_FREQUENCIES,
  REMINDER_STATUSES,
  REMINDER_TYPES,
  type ReminderFrequency,
  type ReminderStatus,
  type ReminderType,
} from "@/features/finance/domain/types"
import {
  type ExpenseFormInput,
  type ExpenseFormValues,
  expenseSchema,
  type GoalContributionFormInput,
  type GoalContributionFormValues,
  type GoalFormInput,
  type GoalFormValues,
  goalContributionSchema,
  goalSchema,
  type IncomeFormInput,
  type IncomeFormValues,
  type InvestmentFormInput,
  type InvestmentFormValues,
  incomeSchema,
  investmentSchema,
  type ReminderFormInput,
  type ReminderFormValues,
  reminderSchema,
} from "@/features/finance/forms/schemas"
import {
  addMonthsToMonthKey,
  getAdjacentMonthKeys,
  getExpenseDefaults,
  getGoalContributionDefaults,
  getGoalDefaults,
  getIncomeDefaults,
  getInitials,
  getInvestmentDefaults,
  getReminderDefaults,
} from "@/features/finance/presentation/dashboard-view-models"
import {
  getActionErrorMessage,
  SelectField,
  TextInputField,
} from "@/features/finance/ui/shared/dashboard-primitives"
import { formatMonthChip } from "@/lib/formatters"
import { cn } from "@/lib/utils"

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
  onUpdateUser: (user: AppUser) => Promise<void> | void
  open: boolean
  user: AppUser
}) {
  const [draftName, setDraftName] = useState(user.name)
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(user.avatarUrl ?? "")
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    queueMicrotask(() => {
      setDraftName(user.name)
      setDraftAvatarUrl(user.avatarUrl ?? "")
    })
  }, [open, user.avatarUrl, user.name])

  function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter até 2 MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast.error("Não foi possível carregar a imagem.")
        return
      }

      setDraftAvatarUrl(reader.result)
    }
    reader.onerror = () => toast.error("Não foi possível carregar a imagem.")
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextName = draftName.trim()

    if (!nextName) {
      toast.error("Informe um nome.")
      return
    }

    try {
      await onUpdateUser({
        ...user,
        avatarUrl: draftAvatarUrl || undefined,
        name: nextName,
      })
      toast.success("Perfil atualizado")
      onOpenChange(false)
    } catch (error) {
      toast.error("Não foi possível atualizar o perfil", {
        description: getActionErrorMessage(error),
      })
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
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Informações pessoais</p>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="profile-name">Nome</FieldLabel>
                      <Input
                        autoComplete="name"
                        id="profile-name"
                        onChange={(event) => setDraftName(event.target.value)}
                        placeholder="Digite seu nome"
                        value={draftName}
                      />
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
                <Button disabled={!draftName.trim()} type="submit">
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
              onClick={() => {
                setIsDeleteConfirmOpen(false)
                onOpenChange(false)
                void onDeleteAccount()
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

export function IncomeDialog({
  income,
  onOpenChange,
  onSubmit,
  open,
}: {
  income: Income | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: IncomeFormValues) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<IncomeFormInput, unknown, IncomeFormValues>({
    defaultValues: getIncomeDefaults(income),
    resolver: zodResolver(incomeSchema),
  })

  useEffect(() => {
    if (open) {
      form.reset(getIncomeDefaults(income))
    }
  }, [form, income, open])

  async function submit(values: IncomeFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{income ? "Editar receita" : "Nova receita"}</DialogTitle>
          <DialogDescription>
            Cadastre entradas mensais e frequências recorrentes.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <TextInputField
              error={form.formState.errors.name}
              label="Nome"
              registration={form.register("name")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="type"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Categoria"
                    onValueChange={(value) => field.onChange(value as IncomeType)}
                    options={INCOME_TYPES}
                    value={field.value}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="frequency"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Frequência"
                    onValueChange={(value) => field.onChange(value as IncomeFrequency)}
                    options={INCOME_FREQUENCIES}
                    value={field.value}
                  />
                )}
              />
            </div>
            <TextInputField
              error={form.formState.errors.amount}
              label="Valor"
              registration={form.register("amount")}
              type="number"
            />
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar receita</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ReminderDialog({
  onOpenChange,
  onSubmit,
  open,
  reminder,
}: {
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ReminderFormValues) => Promise<void> | void
  open: boolean
  reminder: ChargeReminder | null
}) {
  const form = useForm<ReminderFormInput, unknown, ReminderFormValues>({
    defaultValues: getReminderDefaults(reminder),
    resolver: zodResolver(reminderSchema),
  })
  const reminderType = useWatch({ control: form.control, name: "type" })

  useEffect(() => {
    if (open) {
      form.reset(getReminderDefaults(reminder))
    }
  }, [form, open, reminder])

  useEffect(() => {
    if (reminderType === "Recorrente") {
      form.setValue("remainingInstallments", 0)
      form.setValue("totalInstallments", 0)
    }
  }, [form, reminderType])

  async function submit(values: ReminderFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,760px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{reminder ? "Editar lembrete" : "Novo lembrete"}</DialogTitle>
          <DialogDescription>
            Registre cobranças a lembrar sem somar o valor nas receitas do dashboard.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <TextInputField
              error={form.formState.errors.name}
              label="Nome"
              registration={form.register("name")}
            />
            <TextInputField
              error={form.formState.errors.person}
              label="De quem cobrar"
              registration={form.register("person")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="type"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Tipo"
                    onValueChange={(value) => field.onChange(value as ReminderType)}
                    options={REMINDER_TYPES}
                    value={field.value}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="status"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Status"
                    onValueChange={(value) => field.onChange(value as ReminderStatus)}
                    options={REMINDER_STATUSES}
                    value={field.value}
                  />
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.amount}
                label="Valor da cobrança"
                registration={form.register("amount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.nextDueDate}
                label="Próxima cobrança"
                registration={form.register("nextDueDate")}
                type="date"
              />
            </div>
            <Controller
              control={form.control}
              name="frequency"
              render={({ field, fieldState }) => (
                <SelectField
                  error={fieldState.error}
                  label="Periodicidade"
                  onValueChange={(value) => field.onChange(value as ReminderFrequency)}
                  options={REMINDER_FREQUENCIES}
                  value={field.value}
                />
              )}
            />
            {reminderType === "Parcelado" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInputField
                  error={form.formState.errors.totalInstallments}
                  label="Total de parcelas"
                  registration={form.register("totalInstallments")}
                  type="number"
                />
                <TextInputField
                  error={form.formState.errors.remainingInstallments}
                  label="Parcelas restantes"
                  registration={form.register("remainingInstallments")}
                  type="number"
                />
              </div>
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar lembrete</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ExpenseDialog({
  expense,
  onOpenChange,
  onSubmit,
  open,
}: {
  expense: FixedExpense | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ExpenseFormValues) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    defaultValues: getExpenseDefaults(expense),
    resolver: zodResolver(expenseSchema),
  })

  useEffect(() => {
    if (open) {
      form.reset(getExpenseDefaults(expense))
    }
  }, [expense, form, open])

  async function submit(values: ExpenseFormValues) {
    if (values.totalInstallments > 0 && values.remainingInstallments > values.totalInstallments) {
      form.setError("remainingInstallments", {
        message: "Parcelas restantes não podem exceder o total.",
        type: "validate",
      })
      return
    }

    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,760px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar despesa" : "Nova despesa fixa"}</DialogTitle>
          <DialogDescription>
            Registre compromissos mensais, parcelados ou contínuos.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <TextInputField
              error={form.formState.errors.name}
              label="Nome"
              registration={form.register("name")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Categoria"
                    onValueChange={(value) => field.onChange(value as ExpenseCategory)}
                    options={EXPENSE_CATEGORIES}
                    value={field.value}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="status"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error}
                    label="Status"
                    onValueChange={(value) => field.onChange(value as ExpenseStatus)}
                    options={EXPENSE_STATUSES}
                    value={field.value}
                  />
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.monthlyAmount}
                label="Valor mensal"
                registration={form.register("monthlyAmount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.dueDay}
                label="Data de vencimento"
                registration={form.register("dueDay")}
                type="number"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                description="Use 0 para despesas contínuas sem parcelas."
                error={form.formState.errors.totalInstallments}
                label="Total de parcelas"
                registration={form.register("totalInstallments")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.remainingInstallments}
                label="Parcelas restantes"
                registration={form.register("remainingInstallments")}
                type="number"
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar despesa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function InvestmentDialog({
  investment,
  onOpenChange,
  onSubmit,
  open,
}: {
  investment: InvestmentEntry | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: InvestmentFormValues) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<InvestmentFormInput, unknown, InvestmentFormValues>({
    defaultValues: getInvestmentDefaults(investment),
    resolver: zodResolver(investmentSchema),
  })
  const selectedMonth = useWatch({ control: form.control, name: "month" })
  const monthOptions = useMemo(
    () => getAdjacentMonthKeys(selectedMonth ?? getCurrentMonthKey()),
    [selectedMonth],
  )

  useEffect(() => {
    if (open) {
      form.reset(getInvestmentDefaults(investment))
    }
  }, [form, investment, open])

  async function submit(values: InvestmentFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{investment ? "Editar investimento" : "Registrar investimento"}</DialogTitle>
          <DialogDescription>Compare valor planejado e realmente investido.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.month)}>
              <FieldLabel>Mês</FieldLabel>
              <div className="flex items-center gap-2">
                <Button
                  aria-label="Mês anterior"
                  className="shrink-0"
                  onClick={() => {
                    form.setValue(
                      "month",
                      addMonthsToMonthKey(selectedMonth ?? getCurrentMonthKey(), -1),
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <ChevronLeftIcon />
                </Button>
                <div className="grid min-w-0 flex-1 grid-cols-5 gap-2">
                  {monthOptions.map((month) => (
                    <Button
                      aria-pressed={month === (selectedMonth ?? getCurrentMonthKey())}
                      className={cn(
                        "h-8 min-w-0 rounded-full px-2 text-xs",
                        month === (selectedMonth ?? getCurrentMonthKey())
                          ? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      key={month}
                      onClick={() => {
                        form.setValue("month", month, { shouldDirty: true, shouldValidate: true })
                      }}
                      type="button"
                      variant="outline"
                    >
                      <span className="truncate">{formatMonthChip(month)}</span>
                    </Button>
                  ))}
                </div>
                <Button
                  aria-label="Próximo mês"
                  className="shrink-0"
                  onClick={() => {
                    form.setValue(
                      "month",
                      addMonthsToMonthKey(selectedMonth ?? getCurrentMonthKey(), 1),
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <ChevronRightIcon />
                </Button>
              </div>
              <FieldDescription>Escolha rapidamente entre os meses mais próximos.</FieldDescription>
              <FieldError>{form.formState.errors.month?.message}</FieldError>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.plannedAmount}
                label="Valor planejado"
                registration={form.register("plannedAmount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.investedAmount}
                label="Valor investido"
                registration={form.register("investedAmount")}
                type="number"
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar investimento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function GoalDialog({
  goal,
  onOpenChange,
  onSubmit,
  open,
}: {
  goal: Goal | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: GoalFormValues) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<GoalFormInput, unknown, GoalFormValues>({
    defaultValues: getGoalDefaults(goal),
    resolver: zodResolver(goalSchema),
  })
  const deadlineEnabled = useWatch({ control: form.control, name: "deadlineEnabled" })
  const selectedStatus = useWatch({ control: form.control, name: "status" })

  useEffect(() => {
    if (open) {
      form.reset(getGoalDefaults(goal))
    }
  }, [form, goal, open])

  useEffect(() => {
    if (!deadlineEnabled) {
      form.setValue("deadlineDate", "", { shouldDirty: true })
    }
  }, [deadlineEnabled, form])

  async function submit(values: GoalFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Criar meta"}</DialogTitle>
          <DialogDescription>
            Defina o objetivo financeiro, o prazo e o status da sua meta.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <TextInputField
              error={form.formState.errors.name}
              label="Nome da meta"
              registration={form.register("name")}
            />
            <TextInputField
              error={form.formState.errors.targetAmount}
              label="Valor alvo"
              registration={form.register("targetAmount")}
              type="number"
            />
            <Field
              data-invalid={Boolean(
                form.formState.errors.deadlineEnabled || form.formState.errors.deadlineDate,
              )}
            >
              <FieldLabel>Prazo</FieldLabel>
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    aria-pressed={!deadlineEnabled}
                    onClick={() => form.setValue("deadlineEnabled", false, { shouldDirty: true })}
                    size="sm"
                    type="button"
                    variant={!deadlineEnabled ? "default" : "outline"}
                  >
                    Sem prazo
                  </Button>
                  <Button
                    aria-pressed={deadlineEnabled}
                    onClick={() => form.setValue("deadlineEnabled", true, { shouldDirty: true })}
                    size="sm"
                    type="button"
                    variant={deadlineEnabled ? "default" : "outline"}
                  >
                    Com prazo
                  </Button>
                </div>
                {deadlineEnabled ? (
                  <TextInputField
                    error={form.formState.errors.deadlineDate}
                    label="Data do prazo"
                    registration={form.register("deadlineDate")}
                    type="date"
                  />
                ) : null}
                <FieldDescription>
                  Se preferir, lance a meta sem prazo para acompanhar apenas o progresso.
                </FieldDescription>
              </div>
            </Field>
            <SelectField
              error={form.formState.errors.status}
              label="Status"
              onValueChange={(value) => form.setValue("status", value, { shouldDirty: true })}
              options={GOAL_STATUSES}
              value={selectedStatus ?? "Ativa"}
            />
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Salvar meta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function GoalContributionDialog({
  contribution,
  defaultGoalId,
  goals,
  onOpenChange,
  onSubmit,
  open,
}: {
  contribution: GoalContribution | null
  defaultGoalId: string
  goals: Goal[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: GoalContributionFormValues, id?: string) => Promise<void> | void
  open: boolean
}) {
  const form = useForm<GoalContributionFormInput, unknown, GoalContributionFormValues>({
    defaultValues: getGoalContributionDefaults(defaultGoalId, goals, contribution),
    resolver: zodResolver(goalContributionSchema),
  })
  const selectedGoalId = useWatch({ control: form.control, name: "goalId" })

  useEffect(() => {
    if (open) {
      form.reset(getGoalContributionDefaults(defaultGoalId, goals, contribution))
    }
  }, [contribution, defaultGoalId, form, goals, open])

  async function submit(values: GoalContributionFormValues) {
    await onSubmit(values, contribution?.id)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{contribution ? "Editar aporte" : "Registrar aporte"}</DialogTitle>
          <DialogDescription>
            Lance o valor aportado para atualizar a evolução da meta.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.goalId)}>
              <FieldLabel>Meta</FieldLabel>
              <Select
                items={goals.map((goal) => ({ label: goal.name, value: goal.id }))}
                onValueChange={(value) => {
                  if (value !== null) {
                    form.setValue("goalId", value, { shouldDirty: true, shouldValidate: true })
                  }
                }}
                value={selectedGoalId ?? ""}
              >
                <SelectTrigger
                  aria-invalid={Boolean(form.formState.errors.goalId)}
                  aria-label="Meta"
                >
                  <SelectValue placeholder="Selecione uma meta" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError>{form.formState.errors.goalId?.message}</FieldError>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                error={form.formState.errors.amount}
                label="Valor do aporte"
                registration={form.register("amount")}
                type="number"
              />
              <TextInputField
                error={form.formState.errors.date}
                label="Data do aporte"
                registration={form.register("date")}
                type="date"
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">{contribution ? "Salvar alterações" : "Salvar aporte"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
