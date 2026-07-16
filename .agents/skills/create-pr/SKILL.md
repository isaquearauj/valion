---
name: create-pr
description: Criar ou atualizar pull request do Valion. Use quando o usuario pedir para criar PR, abrir PR, fazer push, subir a branch, preparar descricao de PR ou levar uma branch para main com GitHub CLI. Revisa toda a branch, valida o estado, usa base main, escreve contexto SDD/DoD e nunca publica specs locais ou afirma testes nao executados.
argument-hint: "[main]"
allowed-tools: Bash Read Grep Glob
---

# Create Pull Request do Valion

Crie PRs em pt-BR da branch atual para `main`. Push e PR só acontecem após pedido explícito.

## 1. Levantar contexto

Execute e analise:

1. `git status --short --branch`;
2. `git branch --show-current`;
3. `git log main...HEAD --oneline`;
4. `git diff main...HEAD --stat` e o diff completo;
5. `gh pr list --head <branch> --state open --json number,baseRefName,url,title`;
6. `gh api user --jq .login`;
7. `gh label list`.

Use três pontos para comparar contra o merge-base. Leia todos os commits e não imprima o diff inteiro
para o usuário.

Se houver mudança não commitada relevante, pergunte se deve entrar antes do PR. Nunca inclua
`.env*`, `docs/specs`, `.context`, auth state ou credencial.

## 2. Confirmar branch

- Base padrão e única do fluxo normal: `main`.
- Se já estiver em `feat/*`, `fix/*`, `refactor/*`, `docs/*`, `chore/*` ou equivalente, preserve.
- Se estiver em `main`, não empurre commits diretamente: proponha branch Conventional curta.
- Não renomeie branch existente sem pedido.
- Garanta upstream com `git push -u origin <branch>` somente após as confirmações abaixo.

## 3. Confirmar opções em uma rodada

Pergunte:

- PR normal ou draft;
- assignee: recomende o usuário autenticado no `gh`, outro ou nenhum;
- labels: ofereça apenas labels retornadas por `gh label list`;
- se validações pendentes devem ser executadas antes do push.

Se já existir PR aberto para `main`, não duplique. Ofereça atualizar título/corpo com `gh pr edit`.

## 4. Escrever o PR

Título usa Conventional Commits em pt-BR, idealmente abaixo de 70 caracteres.

Corpo:

```markdown
## Resumo

<o que muda e por quê>

## Problema

<problema real, impacto e evidência relevante da descoberta SDD>

## Solução

- **Área** (`arquivo`) — decisão e comportamento

## Arquitetura e dados

<contratos, migrations, providers, rotas, segurança ou "Nenhuma mudança estrutural">

## Definition of Done

- [x] <itens realmente atendidos>
- [ ] <pendências reais>

## QA — Como testar

1. <passo verificável>

**Casos de borda:**

- <caso>

## Validações

- [x] `<comando realmente executado>`
- [ ] <validação pendente>

## Riscos e rollout

<migration protegida, compatibilidade, observação pós-merge ou "Sem risco especial">
```

Não copie a spec local. Sintetize problema, decisão e DoD necessários para o reviewer.

## 5. Criar ou atualizar

Use `gh pr create --base main` com body via arquivo temporário ou HEREDOC. Aplique draft, assignee e
labels confirmados. Para PR existente, use `gh pr edit` sem apagar informação útil manual.

Ao final, informe URL, base/head, estado draft/ready, validações e qualquer pendência.

## Erros que este workflow evita

- descrever só o último commit;
- usar `main..HEAD` em vez de `main...HEAD`;
- criar PR duplicado;
- inventar label;
- publicar spec ou evidência local;
- marcar teste não executado;
- omitir QA/DoD;
- fazer push/PR sem pedido.
