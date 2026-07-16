# Configuração de agentes

Este diretório contém recursos compartilhados entre ferramentas de coding
agents sem duplicar instruções.

- `skills/`: skills no padrão aberto `SKILL.md`, lidas diretamente pelo Codex.
- `agents/`: agentes Markdown do Claude Code.
- `.claude/skills`: symlink para `.agents/skills`.
- `.claude/agents`: symlink para `.agents/agents`.
- `.codex/agents`: agentes Codex em TOML, mantidos separadamente porque o
  formato não é compatível com os agentes Markdown do Claude.
- `CLAUDE.md`: symlink para `AGENTS.md`, que é a fonte de verdade das regras do
  repositório.

Skills novas precisam ter escopo estreito, descrição com gatilhos e limites,
casos realistas em `evals/evals.json` e validação antes de serem tratadas como
estáveis. Workspaces gerados por avaliações são locais e ignorados pelo Git.
