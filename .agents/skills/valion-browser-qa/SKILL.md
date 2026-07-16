---
name: valion-browser-qa
description: Executar QA real do Valion com agent-browser. Use quando uma mudanca afetar rotas, navegacao, formularios, CRUD financeiro, Auth, perfil/avatar, dialogs, loading/erro/pending, responsividade, light/dark, teclado ou quando o usuario pedir validacao visual, dogfood ou QA no navegador. Produz evidencias locais PASS/FAIL/BLOCKED e retesta correcoes. Nao use para mudancas exclusivamente server-side, SQL isolado, docs ou tooling sem efeito observavel na UI.
---

# QA do Valion com agent-browser

## Princípios

- Teste como usuário, sem ler o código-fonte durante a fase de QA.
- Use `agent-browser` diretamente, nunca `npx agent-browser`.
- Carregue as instruções compatíveis com a versão instalada:

```bash
agent-browser skills get core --full
agent-browser skills get dogfood --full
```

- Evidências ficam em `.context/qa-<slug>/` e nunca são versionadas.
- Restrinja navegação ao host colocado em escopo.
- Não exponha credenciais, cookies, tokens, emails pessoais ou dados financeiros reais.
- Use usuário demo e dados identificáveis por prefixo `QA <timestamp>`.
- Classifique observação como issue somente depois de reproduzir.

## Pré-condições

1. Confirme a URL e se o ambiente é local, preview ou produção.
2. Para mutações destrutivas, aceite somente Supabase local confirmado por URL.
3. Verifique `agent-browser --version` e rode `agent-browser doctor --offline --quick` se houver falha.
4. Garanta app e dependências locais ativos; não inicie serviços cloud.
5. Use auth vault com `--password-stdin` quando autenticação for necessária.
6. Crie sessão exclusiva e diretórios de evidência:

```text
.context/qa-<slug>/
├── report.md
├── screenshots/
├── videos/
└── artifacts/
```

Não salve auth state ou HAR com tokens dentro do diretório de evidências sem sanitização.

## Matriz de risco

Selecione somente as áreas afetadas, mas sempre valide o caminho feliz e um caso de borda.

### Autenticação e fronteiras

- acesso anônimo a rota autenticada redireciona para login;
- login/logout e retorno à rota esperada;
- sessão expirada não mistura usuários;
- callbacks permanecem em destinos permitidos.

### Rotas e navegação

- `/dashboard`, `/receitas`, `/despesas`, `/investimentos`, `/metas`, `/historico`;
- acesso direto, reload, navegação interna, back e forward;
- `aria-current`, heading e URL corretos;
- provider/shell permanecem coerentes entre rotas.

### Viewports e tema

- desktop `1440x900`;
- tablet `768x1024`;
- mobile `375x812`;
- light e dark nas superfícies relevantes;
- sem overflow horizontal, corte de conteúdo ou layout shift evidente.

### Teclado e acessibilidade operacional

- Tab e Shift+Tab;
- Enter/Space em controles;
- Escape fecha overlay e restaura foco;
- foco visível e preso corretamente em dialogs;
- labels, mensagens de erro, `aria-invalid`, alerts e confirmação destrutiva.

### CRUD financeiro

- criar, editar e remover o recurso afetado;
- reload confirma persistência;
- renda única aparece somente no mês recebido;
- histórico e snapshots afetados permanecem corretos;
- clique duplo/submissão repetida não duplica registros;
- pending desabilita ações incompatíveis.

### Perfil e avatar

- nome vazio/inválido permanece no dialog com erro inline;
- JPEG/PNG/WebP válido de até 2 MB mostra preview e persiste após reload;
- remoção de avatar persiste;
- arquivo inválido ou grande é rejeitado;
- URL observada é assinada, não pública permanente.

### Exclusão de conta

Peça confirmação explícita ao usuário imediatamente antes de executar, mesmo com usuário demo e
Supabase local. Sem confirmação, teste apenas dialog, foco, copy e cancelamento. Nunca exclua conta
em preview ou produção dentro deste workflow.

## Loop de execução

1. Abra a URL em sessão nomeada e aguarde estado observável, não delays arbitrários.
2. Tire snapshot interativo e screenshot inicial.
3. Execute a matriz selecionada, re-snapshotando após cada mudança de página/estado.
4. Confira `errors`, `console` e requests relevantes durante os fluxos.
5. Ao encontrar falha, reproduza novamente antes de documentar.
6. Registre passos e screenshots imediatamente.
7. Depois da correção, reteste o mesmo fluxo e preserve a evidência anterior.
8. Limpe os registros `QA` criados quando isso não destruir a evidência necessária.
9. Feche a sessão ao terminar.

Refs ficam obsoletos após navegação, submit, abertura de dialog ou rerender significativo. Faça novo
`snapshot -i` antes da próxima ação.

## Evidências

- Issue estática: screenshot anotada e descrição.
- Issue interativa: passos com screenshot antes/ação/resultado; vídeo quando `ffmpeg` estiver
  disponível.
- Falha de vídeo não bloqueia QA se screenshots e passos forem suficientes; marque `BLOCKED` apenas
  para o artefato.
- Não use screenshot como substituto de validar persistência, URL, console ou network.

## Relatório

Use esta estrutura:

```markdown
# Relatório de QA: <escopo>

## Ambiente
URL, sessão, commit, viewport, tema e serviços locais.

## Resumo
Contagem crítica/alta/média/baixa e issues abertas após reteste.

## Matriz
ID | verificação | PASS/FAIL/BLOCKED | evidência

## Issues
Severidade, URL, esperado, observado, passos, evidências e status do reteste.

## Console e network
Erros, requests falhas ou "sem achados".

## Limitações
Tudo que não foi validado e por quê.
```

Não encerre com issue corrigida ainda contabilizada como aberta.

## Entrega

Informe a matriz executada, issues encontradas/corrigidas, bloqueios reais e o caminho local do
relatório. Diferencie claramente comportamento observado de inferência.
