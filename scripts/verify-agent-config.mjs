import { execFileSync } from "node:child_process"
import { lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const failures = []

function fail(message) {
  failures.push(message)
}

function expectSymlink(path, target) {
  const absolute = join(root, path)

  try {
    if (!lstatSync(absolute).isSymbolicLink()) {
      fail(`${path} deve ser um symlink para ${target}.`)
      return
    }

    if (readlinkSync(absolute) !== target) {
      fail(`${path} aponta para ${readlinkSync(absolute)}, esperado ${target}.`)
    }
  } catch {
    fail(`${path} nao existe ou nao pode ser lido.`)
  }
}

function getClaudeAgentNames() {
  return readdirSync(join(root, ".agents/agents"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => {
      const content = readFileSync(join(root, ".agents/agents", entry.name), "utf8")
      const name = /^name:\s*(.+)$/m.exec(content)?.[1]?.trim()
      if (!name) fail(`Agent Claude ${entry.name} nao possui name no frontmatter.`)
      return name
    })
    .filter(Boolean)
    .toSorted()
}

function getCodexAgentNames() {
  return readdirSync(join(root, ".codex/agents"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".toml"))
    .map((entry) => {
      const content = readFileSync(join(root, ".codex/agents", entry.name), "utf8")
      const name = /^name\s*=\s*"([^"]+)"$/m.exec(content)?.[1]
      if (!name) fail(`Agent Codex ${entry.name} nao possui name TOML.`)
      return name
    })
    .filter(Boolean)
    .toSorted()
}

function verifySkills() {
  const skillsRoot = join(root, ".agents/skills")
  const entries = readdirSync(skillsRoot, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory() && !entry.name.endsWith("-workspace"),
  )

  for (const entry of entries) {
    const skillPath = join(skillsRoot, entry.name, "SKILL.md")
    const evalPath = join(skillsRoot, entry.name, "evals/evals.json")
    const triggerEvalPath = join(skillsRoot, entry.name, "evals/trigger-evals.json")

    try {
      const skill = readFileSync(skillPath, "utf8")
      const name = /^name:\s*(.+)$/m.exec(skill)?.[1]?.trim()
      const description = /^description:\s*(.+)$/m.exec(skill)?.[1]?.trim()

      if (name !== entry.name) fail(`Skill ${entry.name}: frontmatter name divergente.`)
      if (!description) fail(`Skill ${entry.name}: description ausente.`)
    } catch {
      fail(`Skill ${entry.name}: SKILL.md ausente ou invalido.`)
    }

    try {
      const evals = JSON.parse(readFileSync(evalPath, "utf8"))
      if (evals.skill_name !== entry.name)
        fail(`Skill ${entry.name}: skill_name dos evals diverge.`)
      if (!Array.isArray(evals.evals) || evals.evals.length < 3) {
        fail(`Skill ${entry.name}: adicione pelo menos tres evals realistas.`)
      }

      for (const evaluation of evals.evals ?? []) {
        if (!evaluation.prompt || !evaluation.expected_output) {
          fail(`Skill ${entry.name}: eval ${evaluation.id ?? "sem id"} incompleto.`)
        }
        if (!Array.isArray(evaluation.assertions) || evaluation.assertions.length === 0) {
          fail(`Skill ${entry.name}: eval ${evaluation.id ?? "sem id"} sem assertions.`)
        }
      }
    } catch {
      fail(`Skill ${entry.name}: evals/evals.json ausente ou invalido.`)
    }

    try {
      const triggerEvals = JSON.parse(readFileSync(triggerEvalPath, "utf8"))
      if (!Array.isArray(triggerEvals) || triggerEvals.length < 20) {
        fail(`Skill ${entry.name}: adicione pelo menos vinte trigger evals.`)
      }
      if (!triggerEvals.some((item) => item.should_trigger === true)) {
        fail(`Skill ${entry.name}: trigger evals sem casos positivos.`)
      }
      if (!triggerEvals.some((item) => item.should_trigger === false)) {
        fail(`Skill ${entry.name}: trigger evals sem near-misses negativos.`)
      }
    } catch {
      fail(`Skill ${entry.name}: evals/trigger-evals.json ausente ou invalido.`)
    }
  }
}

function expectIgnored(path) {
  try {
    execFileSync("git", ["check-ignore", "--quiet", path], { cwd: root })
  } catch {
    fail(`${path} deve permanecer ignorado pelo Git.`)
  }
}

function expectNoTrackedFiles(pathspec) {
  const tracked = execFileSync("git", ["ls-files", pathspec], {
    cwd: root,
    encoding: "utf8",
  }).trim()
  if (tracked) fail(`${pathspec} contem arquivos versionados: ${tracked.split("\n")[0]}`)
}

expectSymlink("CLAUDE.md", "AGENTS.md")
expectSymlink(".claude/skills", "../.agents/skills")
expectSymlink(".claude/agents", "../.agents/agents")

const claudeAgents = getClaudeAgentNames()
const codexAgents = getCodexAgentNames()
if (JSON.stringify(claudeAgents) !== JSON.stringify(codexAgents)) {
  fail(`Paridade de agents divergente: Claude=[${claudeAgents}] Codex=[${codexAgents}].`)
}

verifySkills()
expectIgnored(".context/qa-example/report.md")
expectIgnored("docs/specs/example.md")
expectIgnored(".agents/skills/example-workspace/iteration-1/report.html")
expectNoTrackedFiles(".context")
expectNoTrackedFiles("docs/specs")

if (failures.length > 0) {
  console.error("Configuracao de agents invalida:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Agents/skills validos: ${claudeAgents.length} agents pareados e configuracao local protegida.`,
)
