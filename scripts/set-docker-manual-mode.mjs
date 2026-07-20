import { execFileSync } from "node:child_process"

function runDocker(args) {
  try {
    return execFileSync("docker", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim()
  } catch (error) {
    const details = error.stderr?.toString().trim()
    const suffix = details ? ` ${details}` : ""
    throw new Error(`Não foi possível executar o Docker.${suffix}`)
  }
}

const containerIds = runDocker(["ps", "-aq"])
  .split(/\r?\n/)
  .map((containerId) => containerId.trim())
  .filter(Boolean)

if (containerIds.length === 0) {
  console.log("Nenhum container Docker encontrado.")
  process.exit(0)
}

runDocker(["update", "--restart=no", ...containerIds])
console.log(`Modo manual aplicado a ${containerIds.length} container(s).`)
