import { readFileSync } from "node:fs"

const expectedVersion = readFileSync(new URL("../.nvmrc", import.meta.url), "utf8").trim()
const currentVersion = process.versions.node
const [expectedMajor, expectedMinor] = expectedVersion.split(".")
const [currentMajor, currentMinor] = currentVersion.split(".")

if (currentMajor !== expectedMajor || currentMinor !== expectedMinor) {
  console.error(
    `Versão do Node incompatível: atual ${currentVersion}, esperada ${expectedVersion}. Execute \`nvm use\`.`,
  )
  process.exit(1)
}

if (currentVersion !== expectedVersion) {
  console.warn(
    `Patch do Node diferente da versão local: atual ${currentVersion}, preferida ${expectedVersion}.`,
  )
}
