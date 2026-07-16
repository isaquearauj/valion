# 0002 — Feature-first com App Router

## Status

Aceita.

## Contexto

O dashboard anterior concentrava rotas, formulários, navegação e mutações em arquivos monolíticos,
dificultando bundles por seção, revisão e manutenção.

## Decisão

O App Router compõe páginas e layouts; regras de produto vivem em `features`. Features complexas
podem separar domain, forms, data, state, presentation e UI sem exigir todas as camadas desde o
início. O provider financeiro permanece compartilhado no layout autenticado.

## Consequências

- cada rota possui bundle e seção próprios;
- deep links e navegação nativa são preservados;
- dependências ficam explícitas;
- novos módulos começam pequenos e evoluem por responsabilidade, não por template obrigatório.
