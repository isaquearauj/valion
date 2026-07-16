import { spawnSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

const result = spawnSync(
  "supabase",
  ["gen", "types", "typescript", "--local", "--schema", "public"],
  { encoding: "utf8" },
)

if (result.status !== 0) {
  process.stderr.write(result.stderr || "Não foi possível gerar os tipos do Supabase local.\n")
  process.exit(result.status ?? 1)
}

if (!result.stdout.includes("export type Database")) {
  console.error(
    "A saída do Supabase não contém o contrato Database; o arquivo atual foi preservado.",
  )
  process.exit(1)
}

writeFileSync(resolve("lib/supabase/database.types.ts"), result.stdout)
