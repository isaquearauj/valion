import { readFileSync } from "node:fs"

const expectedVersion = readFileSync(new URL("../.nvmrc", import.meta.url), "utf8").trim()
const currentVersion = process.versions.node

if (currentVersion !== expectedVersion) {
  console.error(
    `Versão do Node incompatível: atual ${currentVersion}, esperada ${expectedVersion}. Execute \`nvm use\`.`,
  )
  process.exit(1)
}
