# Identidade visual Valion — proposta 01

Esta é a referência aprovada para a interface do Valion. A implementação viva dos tokens está em `app/globals.css`; este documento registra as decisões de uso. A identidade é exclusivamente clara (light mode).

## Princípios

- Clareza financeira antes de decoração: números importantes, rótulos e contexto devem ser lidos nessa ordem.
- A marca usa verde profundo. Verde de receita e vermelho de despesa representam dados, não a cor indiscriminada de ações.
- Mobile-first: cartões empilham, ações têm alvos confortáveis, listagens viram cartões no telefone e a navegação vai para um menu acessível.
- Linguagem direta em pt-BR. Estados vazios, erro, carregamento e conclusão devem explicar o próximo passo.

## Fundação

| Papel | Token | Valor |
| --- | --- | --- |
| Fundo | `--background` | `#fafafa` |
| Superfície | `--card` | `#ffffff` |
| Superfície neutra | `--muted` | `#f3f4f3` |
| Texto | `--foreground` | `#18312d` |
| Texto auxiliar | `--muted-foreground` | `#52645e` |
| Marca e ação primária | `--primary` | `#165f52` |
| Receita | `--finance-income` | `#18735e` |
| Despesa | `--finance-expense` | `#a92d29` |
| Aviso | `--finance-warning` | `#926920` |
| Ação de aviso | `--finance-warning-action` | `#926920` (texto branco) |
| Informação | `--finance-info` | `#426d99` |
| Investido (gráficos) | `--chart-3` | `#1688e3` |
| Planejado (gráficos) | `--chart-4` | `#e6a100` |
| Categoria adicional | `--chart-6` | `#a14d8f` |
| Borda | `--border` | `#e2e5e3` |

Cada cor de dados tem uma superfície suave `--finance-*-soft`. Use as classes Tailwind semânticas (`text-finance-expense`, `bg-finance-income-soft`), nunca tons hardcoded por tela. Em gráficos comparativos, receitas são verdes e despesas vermelhas; a diferença deve continuar legível por legenda, rótulos e forma (barra verde arredondada, vermelha reta), inclusive sem depender somente de cor. No gráfico de gastos por categoria, hover ou foco na legenda destaca a categoria correspondente e atenua as demais; clique mantém o destaque selecionado.

Manrope é a tipografia de títulos e números de destaque; DM Sans é a tipografia de interface e texto corrido. Valores monetários usam numerais tabulares. A escala principal é: página 28–32 px, cartão 16 px, corpo 14–16 px, metadado 12–13 px. Preserve a hierarquia sem criar mais de um título principal por tela.

O raio base é 14 px. Cartões usam raio maior, borda sutil e sombra discreta. Espaçamento segue incrementos de 4 px, com 20–24 px dentro de cartões e 24–32 px entre grandes seções. Botões principais e campos têm pelo menos 40 px de altura; em fluxos de toque, prefira 44 px quando possível. O foco visível nunca deve desaparecer.

## Padrões de interface

- **Shell:** sidebar clara no desktop, marca no topo, item ativo com superfície verde suave; cabeçalho contextual e menu mobile.
- **Visão Geral:** com dados, hero verde profundo com orçamento livre e percentual comprometido; abaixo, métricas de receita/despesa e gráficos com legenda. Evite repetir o mesmo número sem acrescentar contexto. Sem dados financeiros, mostre boas-vindas e três caminhos de primeiro uso (receitas, despesas e investimentos) no lugar de números e gráficos zerados.
- **Telas de gestão:** título, descrição breve, uma ação primária no topo e depois métricas/listagem. Receitas, despesas, investimentos, metas e histórico usam as mesmas primitives de cartão, formulário e tabela. Listagens pesquisáveis mantêm busca, paginação quando necessária, estado sem resultados e cartões mobile com as mesmas ações da tabela desktop.
- **Autenticação:** composição mobile-first com formulário direto. No desktop, painel verde conta o propósito do produto; números demonstrativos são apenas ilustração, nunca dados da conta.
- **Conta:** perfil e segurança em áreas separadas; ações irreversíveis ficam isoladas e pedem confirmação. Campos somente leitura deixam explícito que não são editáveis nessa tela.
- **Estados:** carregamento mantém a estrutura; erro informa recuperação; vazio aponta para a primeira ação; ações destrutivas mantêm confirmação e cor semântica.

## Implementação e evolução

Tokens de tema ficam em `app/globals.css`, primitives em `components/ui`, shell em `features/finance/ui/shell` e padrões financeiros compartilhados em `features/finance/ui/shared`. Para novos componentes, comece pelos tokens e primitives existentes. Não reintroduza toggle, provider ou variantes escuras sem nova decisão de produto.

Critérios de revisão: contraste e foco, largura de 320 px até desktop, teclado, estados de erro/vazio, diferença entre receita e despesa nos gráficos, legibilidade de R$ e datas e consistência entre as rotas. Esta documentação consolida a proposta aprovada; o código da aplicação e seus dados reais são a fonte da experiência final.
