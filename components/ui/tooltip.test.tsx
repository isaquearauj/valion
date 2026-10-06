import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { AppTooltip } from "@/components/ui/tooltip"

describe("Tooltip", () => {
  it("renders trigger and displays tooltip content on hover", async () => {
    const user = userEvent.setup()

    render(
      <AppTooltip content="Ver detalhes">
        <button type="button">Ação</button>
      </AppTooltip>,
    )

    const trigger = screen.getByRole("button", { name: "Ação" })
    expect(trigger).toBeInTheDocument()

    await user.hover(trigger)
    expect(await screen.findByText("Ver detalhes")).toBeInTheDocument()
  })

  it("renders child directly when content is empty", () => {
    render(
      <AppTooltip content="">
        <button type="button">Ação Simples</button>
      </AppTooltip>,
    )

    expect(screen.getByRole("button", { name: "Ação Simples" })).toBeInTheDocument()
  })
})
