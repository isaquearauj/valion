# Configuração do Supabase

Este projeto usa Supabase em produção para autenticação, perfis e persistência financeira com RLS por usuário.

## 1. Criar o projeto

1. Acesse `https://supabase.com/dashboard`.
2. Crie uma organização ou use uma existente.
3. Crie um novo projeto.
4. Defina região, nome e senha do banco.

## 2. Schema e migrations

O banco local é recriado exclusivamente a partir de migrations versionadas em
`supabase/migrations/`. `supabase/schema.sql` é uma referência de schema, não o
fluxo de aplicação em produção.

## 3. Configurar autenticação

1. Vá em `Authentication > Providers`.
2. Habilite `Email`.
3. Habilite a confirmação de e-mail.
4. Configure `Site URL` como `https://valionapp.com`.
5. Configure `Redirect URLs` com:

```txt
https://valionapp.com/**
https://www.valionapp.com/**
http://localhost:3000/**
```

## 4. Ambiente local e produção

Para produção/preview na Vercel, preencha as variáveis com o projeto Supabase Cloud:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

As chaves ficam em `Project Settings > API`. A `SUPABASE_SERVICE_ROLE_KEY` deve existir apenas em ambiente server-side e nunca deve ser exposta com prefixo `NEXT_PUBLIC`.

Para desenvolvimento local, use Supabase CLI + Docker. `.env.supabase` não é
necessário:

```bash
pnpm supabase:start
pnpm supabase:status
```

Configure `.env.local` com os valores locais exibidos pelo CLI:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-local>
SUPABASE_SERVICE_ROLE_KEY=<secret-local>
```

E-mails de autenticação enviados localmente ficam disponíveis no Mailpit:

```txt
http://127.0.0.1:55324
```

Isso permite testar `/recover` sem consumir o rate limit do Supabase Cloud.

Com confirmação de e-mail ativa, o cadastro cria o usuário no Auth, mas o acesso ao painel só acontece depois da confirmação pelo link recebido.

Para recriar o banco local e aplicar todas as migrations:

```bash
supabase db reset --local
# ou: pnpm supabase:reset
```

Para validar RLS e constraints no banco local:

```bash
pnpm test:supabase
```

Essa suite exige Supabase local ativo, Docker disponível e as variáveis locais carregadas.

Para carregar dados demonstrativos no usuário local:

```bash
pnpm supabase:seed
```

O seed só aceita URLs `localhost` ou `127.0.0.1`, cria o usuário `valion-demo@example.test` e usa UUIDs fixos para ser idempotente. Para recriar o banco e carregar os dados em sequência, use `pnpm supabase:reset:seed`.

## 5. Exclusão real de conta

A rota `DELETE /api/account` usa `SUPABASE_SERVICE_ROLE_KEY` para remover o usuário do Supabase Auth. As tabelas financeiras usam `on delete cascade`, então os dados vinculados são removidos junto com a conta.

## 6. Deploy na Vercel

1. Suba o projeto para o GitHub.
2. Importe o projeto na Vercel.
3. Adicione `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` em `Settings > Environment Variables`.
4. Faça o deploy.
5. Configure `valionapp.com` como domínio principal e `www.valionapp.com` como redirect para o domínio raiz.

## 7. Manutenção

A migration baseline local está em `supabase/migrations/20260606000000_baseline.sql`. Ela já foi reconciliada como aplicada no Supabase Cloud.

### Migrations locais

Toda alteração de tabelas, índices, triggers, constraints ou policies deve ser criada como uma nova migration em `supabase/migrations/`. Valide sempre no banco local:

```bash
pnpm supabase:reset
pnpm test:supabase
```

Não execute `supabase db push` diretamente contra produção como parte do fluxo normal.

### Acesso local à CLI e inspeção autorizada

Para consultar um projeto remoto de forma autorizada, sem aplicar migrations:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase start
supabase db diff --linked
```

`supabase login` autentica a CLI. `supabase link` vincula o projeto local ao
projeto remoto e pode solicitar a senha interativamente. A senha nunca deve
ser enviada pelo chat, commitada ou colocada em arquivos do repositório. A CLI
pode armazenar credenciais no armazenamento nativo do sistema; esse acesso é
persistente somente para a mesma máquina e usuário. Runners efêmeros devem
usar secrets ou um secret manager. `supabase db diff --linked` serve apenas
para inspeção e não aplica migrations. Use `supabase logout` quando o acesso
não for mais necessário.

### Migrations de produção

O deploy é feito por `.github/workflows/supabase-migrations.yml`. Depois de
qualquer `push` na `main`, o workflow aguarda o `CI` desse commit e só aplica as
migrations se ele terminar com sucesso. Isso cobre tanto merges de PR quanto
commits diretos, sempre com checkout do SHA exato que foi validado.

O disparo manual permanece disponível como fallback operacional:

```bash
gh workflow run "Supabase migrations" --ref main
gh run list --workflow "Supabase migrations" --branch main --limit 1
```

O workflow usa exclusivamente os secrets do GitHub Environment `production`:

- `SUPABASE_ACCESS_TOKEN`: token usado apenas pelo GitHub Actions.
- `SUPABASE_DB_PASSWORD`: senha do banco de produção.
- `SUPABASE_PROJECT_REF`: project ref do projeto de produção.

Esses valores não devem ser commitados, enviados ao chat ou colocados em arquivos `.env`. Agentes podem preparar migrations e executar testes locais. Proteções ou aprovações configuradas no GitHub Environment `production` continuam sendo respeitadas pelo workflow automático.

Em caso de erro, não edite uma migration já aplicada. Crie uma nova migration corretiva. Para mudanças destrutivas ou de alto risco, faça backup e valide primeiro em staging ou em uma cópia local.

Para consultar o histórico remoto sem aplicar mudanças, use a CLI autenticada
e vinculada; nunca execute `supabase db push` diretamente contra produção.

```bash
supabase migration list
```

O workflow só aplica migrations versionadas em `supabase/migrations/`. Ele não
executa seed, `supabase db reset --linked` nem SQL arbitrário. Os secrets
devem permanecer no environment `production`; required reviewers não devem ser
obrigatórios quando a execução pelo agente estiver habilitada.

Migrations de dados devem ser idempotentes quando possível. Depois que uma
migration for aplicada, não a edite: crie uma nova migration corretiva. Para
alterações destrutivas, faça backup e valide a operação localmente antes da
aprovação. Rollback é feito por uma migration corretiva, não apagando o
histórico aplicado.

Depois de aplicar migrations locais, gere e versione o contrato oficial:

```bash
pnpm supabase:types
```

Os clientes browser, server e admin usam `Database`. Repositórios financeiros
consomem `Tables`, `TablesInsert` e `TablesUpdate`; não mantenha rows manuais ou
casts para mascarar drift.

## 8. Avatares privados

O bucket `profile-avatars` é privado e aceita apenas JPEG, PNG e WebP de até 2
MB. Objetos ficam em `<user-id>/<uuid>.<ext>` e policies conferem o primeiro
segmento contra `auth.uid()`. `profiles.avatar_path` guarda somente o caminho;
a aplicação cria URL assinada com validade curta. `avatar_url` existe
temporariamente para a migração única de base64 legado.

Ao excluir uma conta, a rota remove todos os objetos do prefixo antes de excluir
o usuário Auth. Falha de Storage interrompe a exclusão para não deixar objetos
órfãos.
