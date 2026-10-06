"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      className={cn("flex flex-col gap-4", className)}
      data-slot="tabs"
      {...props}
    />
  )
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-xl border border-border/80 bg-muted/70 p-1 text-muted-foreground shadow-2xs",
        className,
      )}
      data-slot="tabs-list"
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "inline-flex flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-all outline-none select-none",
        "hover:bg-muted/40 hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        // Suporte robusto a estado ativo em Base UI (aria-selected="true" e data-active)
        "aria-selected:border-border/80 aria-selected:bg-card aria-selected:font-bold aria-selected:text-primary aria-selected:shadow-xs",
        "data-active:border-border/80 data-active:bg-card data-active:font-bold data-active:text-primary data-active:shadow-xs",
        "data-[active]:border-border/80 data-[active]:bg-card data-[active]:font-bold data-[active]:text-primary data-[active]:shadow-xs",
        className,
      )}
      data-slot="tabs-trigger"
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      className={cn(
        "flex-1 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      data-slot="tabs-content"
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
