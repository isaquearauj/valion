# Avaliação da skill `create-pr`

## Método

- 4 cenários de resultado, cada um executado uma vez com a skill e uma vez sem a skill.
- Grade cega por assertion sobre os artefatos de resposta; a configuração não foi usada como
  critério de qualidade.
- Agregação pelo `aggregate_benchmark.py` e revisão estática pelo viewer oficial da
  `skill-creator`.
- Nenhum push, PR ou outra mutação externa foi executado durante os evals.

## Resultado

| Configuração | Média por eval | Assertions | Delta |
| --- | ---: | ---: | ---: |
| Com `create-pr` | 100% | 13/13 | +27,1 p.p. |
| Sem skill | 72,9% | 9/13 | referência |

O ganho ficou concentrado nos cenários que exigem executar a inspeção da branch em vez de apenas
prometê-la: criação de PR normal e prevenção de PR duplicado. A versão com skill também entregou o
corpo completo do PR e consultou PR, usuário e labels reais antes de sugerir opções.

Os cenários de privacidade da spec e preparação sem mutação passaram nas duas configurações. Eles
continuam úteis como salvaguardas, mas não mediram valor incremental nesta amostra porque as regras
globais do projeto já protegem esses comportamentos.

## Trigger evals

`evals/trigger-evals.json` contém 20 casos: 10 positivos e 10 negativos próximos. A cobertura
inclui criar/atualizar/draft PR, push explícito, descrição sem publicar, commit ou branch sem push,
migration, QA, spec, conflitos e release notes.

O gate estrutural valida quantidade e polaridade. O loop probabilístico de triggering por modelo
não foi executado nesta rodada; portanto, esta avaliação não afirma uma taxa de acionamento.

## Limitações

- Há uma execução por configuração, sem medida de variância ou flakiness.
- Os executores não forneceram transcript, duração ou tokens; esses campos permanecem como
  telemetria indisponível, não como zero custo.
- A grade de ações read-only usa os resultados específicos relatados na resposta, pois não há
  transcript de tool calls.
- O baseline recebeu as instruções gerais do projeto, o que torna a comparação conservadora para
  privacidade e autorização de mutações.

## Artefatos locais

Resultados, grades, benchmark e viewer ficam em
`.agents/skills/create-pr-workspace/iteration-1/`. O diretório é local e ignorado pelo Git; abra
`review.html` para revisar qualitativamente cada par e as grades formais.
