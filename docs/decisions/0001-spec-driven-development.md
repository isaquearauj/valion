# 0001 — Spec-Driven Development

## Status

Aceita.

## Contexto

Mudanças de produto e dados financeiros falham com facilidade quando implementação começa antes de
o problema, as decisões e o resultado esperado estarem claros. Luis e Isaque possuem contexto de
produto que não pode ser inferido apenas pelo código.

## Decisão

Mudanças relevantes usam SDD: descoberta colaborativa, spec local, Definition of Done verificável,
implementação incremental e validação proporcional. Specs não possuem diretório obrigatório, são
locais, não são versionadas e explicitam o modelo de dados envolvido. Tarefas triviais podem usar
fluxo reduzido.

## Consequências

- decisões de produto ficam explícitas antes do código;
- o agente precisa separar fatos, hipóteses e perguntas;
- PRs registram contexto e DoD, mas não publicam a spec local;
- a qualidade depende da participação de Luis/Isaque nas decisões materiais.
