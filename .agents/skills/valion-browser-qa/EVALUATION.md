# Avaliação da skill `valion-browser-qa`

## Método

- Iteração local: `.agents/skills/valion-browser-qa-workspace/iteration-1/`.
- Seis prompts de resultado, com uma resposta `with_skill` e uma `without_skill` por prompt.
- Grading cego pelas assertions de `evals/evals.json`, calibrado para avaliar procedimento,
  classificação `BLOCKED` e proteções quando a execução estava explicitamente proibida.
- Métricas de tempo, tokens e tool calls não estavam disponíveis e foram registradas como zero.

## Resultado

O agregador calculou média de **100%** para as duas configurações, delta **0,00**. Isso confirma que
as duas respostas respeitaram o procedimento e as proteções avaliadas, mas não demonstra valor
incremental da skill. Os evals 1–4 foram executados sob restrição read-only, sem browser, serviços ou
dados demo; os evals 5–6 avaliaram proporcionalidade e segurança destrutiva. O baseline também
cobriu todos esses comportamentos.

O conjunto revelou que uma próxima comparação útil precisa disponibilizar um ambiente local
controlado para os cenários de execução e manter separados os evals de decisão/safety. Também vale
dividir assertions compostas, como “reproduzir e classificar”, para distinguir contenção correta de
execução ausente.

## Trigger evals

`evals/trigger-evals.json` contém 20 casos realistas: 10 positivos e 10 near-negatives cobrindo
navegação, CRUD, perfil, regressão, docs, SQL, testes e tooling. O arquivo foi implementado e validado
estruturalmente; esta avaliação de resultado não executou o loop probabilístico de triggering.

## Review local

O review qualitativo e quantitativo foi gerado em
`.agents/skills/valion-browser-qa-workspace/iteration-1/review.html`. O workspace e as evidências são
locais e ignorados pelo Git; somente este resumo permanece versionado.
