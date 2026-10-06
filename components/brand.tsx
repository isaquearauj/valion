import type React from "react"
import { cn } from "@/lib/utils"

export function Brand({ className, subtitle }: { className?: string; subtitle?: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-heading text-xl font-extrabold tracking-[-0.06em]",
        className,
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary text-primary-foreground">
        <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
          <path
            d="M4.5 7.5L12 18L19.5 7.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        </svg>
      </span>
      {subtitle ? (
        <span className="flex flex-col text-left">
          <span className="leading-tight">Valion</span>
          <span className="font-sans text-[11px] font-normal tracking-normal text-muted-foreground">
            {subtitle}
          </span>
        </span>
      ) : (
        <span>Valion</span>
      )}
    </span>
  )
}
