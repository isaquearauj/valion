# Avaliação da skill

Última avaliação: iteration-4, em 16 de julho de 2026.

## Método

- Quatro cenários de resultado: renda única, App Router, corrida no provider e seção de reservas.
- Uma execução da skill atual e uma do snapshot anterior por cenário.
- Grading cego pelas assertions de `evals/evals.json`, exigindo evidência de entrega; proposta futura sem artefato não recebeu crédito.
- Inspeção read-only do repositório para verificar as alegações factuais da configuração atual.

## Resultado

| Configuração | Pass rate |
| --- | ---: |
| Skill atual | 87,5% (14/16) |
| Snapshot anterior | 18,8% (3/16) |
| Delta | +68,8 p.p. |

A skill atual localizou e explicou corretamente a implementação existente nos três cenários de
arquitetura e persistência. No cenário de reservas, ambas as versões preservaram o escopo e
identificaram a decisão de produto, mas nenhuma implementou a seção ou seus testes; as duas ficaram
em 50% nesse eval.

## Limitações

- Há uma execução por configuração e cenário; não há medida de variância entre repetições.
- Tokens, duração e tool calls não foram disponibilizados e aparecem como zero no benchmark.
- O eval de reservas contém assertions compostas; uma próxima iteração deve separar implementação,
  acessibilidade/responsividade e testes para tornar o diagnóstico mais granular.
- Os 20 casos de trigger vivem em `evals/trigger-evals.json`; esta medição cobre resultado, não taxa de
  acionamento da descrição.

## Evidência local

O workspace bruto permanece ignorado em
`.agents/skills/valion-finance-feature-workspace/iteration-4/`. O review estático local fica em
`review.html`, e o benchmark detalhado em `benchmark.json`/`benchmark.md`. Esses artefatos não devem
ser versionados.
