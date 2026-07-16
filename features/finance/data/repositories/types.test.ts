import { describe, expect, it } from "vitest"
import { getRepositoryData } from "@/features/finance/data/repositories/types"

describe("repository result contract", () => {
  it("returns persisted data", () => {
    expect(getRepositoryData({ id: "row-1" }, null, "Falha")).toEqual({ id: "row-1" })
  })

  it("uses a generic message for errors and missing rows", () => {
    expect(() => getRepositoryData(null, { message: "private detail" }, "Falha genérica")).toThrow(
      "Falha genérica",
    )
    expect(() => getRepositoryData(null, null, "Linha ausente")).toThrow("Linha ausente")
  })
})
