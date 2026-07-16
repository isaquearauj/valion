# Avaliação da skill

Última avaliação: iteration-4, em 16 de julho de 2026.

## Método

- Quatro cenários de resultado: avatar privado, tipos gerados, snapshots e exclusão de conta.
- Uma execução da skill atual e uma do snapshot anterior por cenário.
- Grading cego pelas 16 assertions atuais, aplicando o mesmo ônus de evidência às duas configurações.
- A avaliação foi somente leitura: não executou Supabase, migrations ou exclusão destrutiva.

## Resultado

| Configuração | Pass rate |
| --- | ---: |
| Skill atual | 100% (16/16) |
| Snapshot anterior | 100% (16/16) |
| Delta | 0,0 p.p. |

As duas versões registraram corretamente os contratos de segurança e os testes necessários. A skill
atual foi mais explícita em compensação de upload, bloqueio de ambiente e confirmação antes de QA
destrutivo, mas essas diferenças não alteraram as assertions binárias desta rodada.

## Limitações

- Há uma execução por configuração e cenário; não existe medida de variância entre repetições.
- Tokens, duração e tool calls não foram disponibilizados e aparecem como zero no benchmark.
- As assertions não discriminaram a versão atual do snapshot anterior. Uma próxima rodada deve usar
  cenários adversariais com omissões sutis de RLS, paginação, rollback e privilégios.
- Os 20 casos de trigger em `evals/trigger-evals.json` são independentes desta medição de resultado.

## Evidência local

O workspace bruto permanece ignorado em
`.agents/skills/valion-supabase-workspace/iteration-4/`. O review estático local fica em
`review.html`, e o benchmark detalhado em `benchmark.json`/`benchmark.md`. Esses artefatos não devem
ser versionados.
