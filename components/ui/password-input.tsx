"use client"

import { EyeIcon, EyeOffIcon } from "lucide-react"
import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordInputProps = React.ComponentProps<typeof Input>

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
          className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground transition-colors hover:text-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
        >
          {showPassword ? (
            <EyeOffIcon className="size-4" aria-hidden="true" />
          ) : (
            <EyeIcon className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    )
  },
)

PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
