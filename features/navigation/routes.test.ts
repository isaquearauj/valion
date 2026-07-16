import { describe, expect, it } from "vitest"
import {
  appSectionPaths,
  getAppSectionFromPath,
  getAppSectionPath,
} from "@/features/navigation/routes"

describe("finance App Router map", () => {
  it("maps every main section to a stable direct path", () => {
    expect(
      Object.entries(appSectionPaths).map(([section, path]) => [
        section,
        getAppSectionFromPath(path),
      ]),
    ).toEqual([
      ["dashboard", "dashboard"],
      ["expenses", "expenses"],
      ["goals", "goals"],
      ["history", "history"],
      ["incomes", "incomes"],
      ["investments", "investments"],
    ])
    expect(getAppSectionPath("incomes")).toBe("/receitas")
  })

  it("accepts trailing slashes and rejects utility or unknown routes", () => {
    expect(getAppSectionFromPath("/despesas/")).toBe("expenses")
    expect(getAppSectionFromPath("/alterar-senha")).toBeNull()
    expect(getAppSectionFromPath("/nao-existe")).toBeNull()
  })
})
