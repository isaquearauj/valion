---
name: valion-finance-feature
description: Implementar ou revisar funcionalidades financeiras verticais no Valion. Use quando a tarefa alterar receitas, despesas, lembretes, investimentos, metas, aportes, historico, calculos, formularios ou secoes do dashboard. Inclui dominio, validacao, mapeamento, store, UI e testes. Nao use para toolchain, docs isoladas ou auth sem regra financeira.
---

# Funcionalidades financeiras no Valion

## Mapeie o corte vertical

1. Leia `AGENTS.md` e `docs/architecture.md`.
2. Localize a regra em `features/finance/domain`, o schema em `forms`, o mapper
   em `data`, a mutacao em `hooks` e a apresentacao em `ui`.
3. Decida explicitamente se a mudanca exige persistencia. Se exigir, use tambem
   a skill `valion-supabase`.
4. Reproduza o comportamento no codigo e nos testes atuais antes de planejar a
   correcao. Se a protecao e a regressao ja existirem, reporte a divergencia do
   pedido em vez de inventar uma mudanca.
5. Preserve o comportamento existente coberto por testes antes de refatorar.
6. Quando formula, taxonomia ou regra de produto nao estiver definida, separe
   fato confirmado, hipotese recomendada e decisao que precisa de aprovacao. Nao
   trate uma formula inventada como requisito fechado.

## Ordem de implementacao

Para uma mudanca persistida, trabalhe nesta ordem:

1. contrato de banco e migration;
2. tipo de dominio;
3. schema Zod e normalizacao;
4. row e mapper Supabase;
5. query ou mutacao no store;
6. view model/calculo puro;
7. UI, estados de loading/erro/vazio e copy pt-BR;
8. testes unitarios e de integracao necessarios.

Para uma mudanca sem persistencia, comece pela regra pura ou view model e
mantenha o store e o banco fora do escopo.

## Limites de arquitetura

- Dominio nao importa React, Next ou Supabase.
- UI nao monta payload SQL diretamente.
- Use tokens de `app/globals.css`; nao adicione cores isoladas sem necessidade.
- Preserve light/dark, responsividade, teclado e leitores de tela.
- Nao aumente os arquivos monoliticos `finance-dashboard.tsx` e
  `finance-dialogs.tsx` com novas responsabilidades. Extraia a secao ou dialogo
  tocado quando a mudanca for substancial.
- Nao crie rota, item de sidebar, tabela, migration ou estado persistido sem o
  pedido exigir essa superficie. Uma nova secao que reaproveita dados existentes
  deve permanecer dentro do dashboard e consumir o view model/store atual.
- Toda secao nova declara os estados de loading, erro, vazio e dados. Quando a
  shell existente ja for dona de loading/erro, registre essa heranca em vez de
  duplicar estado local.
- Mensagens apresentadas ao usuario ficam em pt-BR e nao revelam detalhes do
  banco.

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
