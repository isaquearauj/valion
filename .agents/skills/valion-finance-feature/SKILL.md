---
name: valion-finance-feature
description: Implementar ou revisar funcionalidades financeiras verticais no Valion. Use quando a tarefa alterar receitas, despesas, lembretes, investimentos, metas, aportes, historico, calculos, formularios ou secoes do dashboard. Inclui dominio, validacao, mapeamento, store, UI e testes. Nao use para toolchain, docs isoladas ou auth sem regra financeira.
---

# Funcionalidades financeiras no Valion

## Mapeie o corte vertical

1. Leia `AGENTS.md` e `docs/architecture.md`.
2. Localize a regra em `features/finance/domain`, o schema em `forms`, o mapper
   e repositorio tipado em `data`, a acao no provider/store e a rota em `ui/routes`.
3. Decida explicitamente se a mudanca exige persistencia. Se exigir, use tambem
   a skill `valion-supabase`.
4. Reproduza o comportamento no codigo e nos testes atuais antes de planejar a
   correcao. Se a protecao e a regressao ja existirem, reporte a divergencia do
   pedido em vez de inventar uma mudanca.
5. Preserve o comportamento existente coberto por testes antes de refatorar.
   Rotas principais usam App Router real; nao reintroduza estado de secao,
   `history.pushState` ou listeners de `popstate`.
6. Quando formula, taxonomia ou regra de produto nao estiver definida, separe
   fato confirmado, hipotese recomendada e decisao que precisa de aprovacao. Nao
   trate uma formula inventada como requisito fechado.

## Ordem de implementacao

Para uma mudanca persistida, trabalhe nesta ordem:

1. contrato de banco e migration;
2. tipo de dominio;
3. schema Zod e normalizacao;
4. row e mapper Supabase;
5. repositorio tipado que retorna a row persistida;
6. acao agrupada no contrato explicito do provider;
7. view model/calculo puro;
8. UI de rota, estados de loading/erro/vazio e copy pt-BR;
9. testes unitarios e de integracao necessarios.

Para uma mudanca sem persistencia, comece pela regra pura ou view model e
mantenha o store e o banco fora do escopo.

## Limites de arquitetura

- Dominio nao importa React, Next ou Supabase.
- UI nao monta payload SQL diretamente.
- Use tokens de `app/globals.css`; nao adicione cores isoladas sem necessidade.
- Preserve light/dark, responsividade, teclado e leitores de tela.
- Cada rota principal renderiza apenas sua secao e carrega seu bundle. Coloque
  formularios junto do recurso e nao recrie um dashboard/dialogos monolitico.
- UI nao monta payload Supabase. Use `Tables`, `TablesInsert` e `TablesUpdate`
  de `lib/supabase/database.types.ts` nos repositorios.
- O provider expoe `state`, `status`, `error`, `retry`, `isPending` e acoes
  agrupadas por recurso. Nao use `ReturnType<typeof useFinanceStore>` como API.
- Nao crie rota, item de sidebar, tabela, migration ou estado persistido sem o
  pedido exigir essa superficie. Uma nova secao que reaproveita dados existentes
  deve permanecer dentro do dashboard e consumir o view model/store atual.
- Toda secao nova declara os estados de loading, erro, vazio e dados. Quando a
  shell existente ja for dona de loading/erro, registre essa heranca em vez de
  duplicar estado local.
- Mensagens apresentadas ao usuario ficam em pt-BR e nao revelam detalhes do
  banco.

## Renda unica e snapshots

- Receita com frequencia `Única` exige `receivedOn`; recorrencias persistem
  `received_on` nulo. O resumo inclui o valor apenas no mes recebido.
- O banco e dono dos snapshots. Mutacoes de recorrencias/despesas atualizam
  somente o mes atual; renda unica historica aplica delta pontual; investimento
  historico altera apenas seus campos. Nunca recalcule historico com cadastros
  recorrentes atuais no cliente.
- O carregamento chama a RPC autenticada sem `user_id` para garantir o snapshot
  atual. Mutacoes atualizam apenas o recurso afetado e os snapshots impactados;
  as sete consultas paralelas ficam restritas ao load/retry.
- Proteja loads contra resposta antiga com abort, id monotônico e conferencia
  do usuario. Bloqueie submissao duplicada pela action key.

## Testes

- Regra financeira pura: teste em `domain` ou `presentation`.
- Entrada de formulario: teste o schema Zod, limites e normalizacao.
- Contrato DB/UI: teste o mapper.
- Bug: primeiro prove a falha; depois adicione o teste que falha antes da
  correcao. Nao altere codigo quando o caso ja estiver protegido e testado.
- Banco/RLS: rode `pnpm verify:supabase` com Supabase local. Esse e o comando
  canonico e executa `pnpm supabase:reset` seguido de `pnpm test:supabase`.

Finalize com:

```bash
pnpm verify
git diff --check
```

## Entrega

Relate o comportamento entregue, as camadas tocadas, testes executados e
validacao visual ainda pendente. Diferencie claramente verificacao automatica
de inspecao manual.
