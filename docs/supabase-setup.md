# Configuração do Supabase

Este projeto usa Supabase em produção para autenticação, perfis e persistência financeira com RLS por usuário.

## 1. Criar o projeto

1. Acesse `https://supabase.com/dashboard`.
2. Crie uma organização ou use uma existente.
3. Crie um novo projeto.
4. Defina região, nome e senha do banco.

## 2. Executar o schema

1. Abra o projeto no Supabase.
2. Vá em `SQL Editor`.
3. Copie o conteúdo de `supabase/schema.sql`.
4. Execute o script completo.
5. Confirme que as tabelas foram criadas com RLS ativo.

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

## 4. Criar `.env.local`

Para produção/preview na Vercel, preencha as variáveis com o projeto Supabase Cloud:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

As chaves ficam em `Project Settings > API`. A `SUPABASE_SERVICE_ROLE_KEY` deve existir apenas em ambiente server-side e nunca deve ser exposta com prefixo `NEXT_PUBLIC`.

Para desenvolvimento local, use Supabase CLI + Docker:

```bash
pnpm supabase:start
pnpm supabase:status
```

Configure `.env.local` com os valores locais exibidos pelo CLI:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-local>
SUPABASE_SERVICE_ROLE_KEY=<secret-local>
```

E-mails de autenticação enviados localmente ficam disponíveis no Mailpit:

```txt
http://127.0.0.1:54324
```

Isso permite testar `/recover` sem consumir o rate limit do Supabase Cloud.

Com confirmação de e-mail ativa, o cadastro cria o usuário no Auth, mas o acesso ao painel só acontece depois da confirmação pelo link recebido.

Para recriar o banco local:

```bash
pnpm supabase:reset
```

## 5. Exclusão real de conta

A rota `DELETE /api/account` usa `SUPABASE_SERVICE_ROLE_KEY` para remover o usuário do Supabase Auth. As tabelas financeiras usam `on delete cascade`, então os dados vinculados são removidos junto com a conta.

## 6. Deploy na Vercel

1. Suba o projeto para o GitHub.
2. Importe o projeto na Vercel.
3. Adicione `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` em `Settings > Environment Variables`.
4. Faça o deploy.
5. Configure `valionapp.com` como domínio principal e `www.valionapp.com` como redirect para o domínio raiz.

## 7. Manutenção

A migration baseline local está em `supabase/migrations/20260606000000_baseline.sql`. Como o schema já foi aplicado manualmente no Supabase Cloud antes da introdução das migrations, antes de usar `supabase db push` em produção marque essa baseline como aplicada no projeto remoto:

```bash
pnpm exec supabase migration repair 20260606000000 --status applied
```

Depois disso, novas migrations podem ser enviadas com:

```bash
pnpm exec supabase db push
```

Para gerar tipos oficiais do Supabase no futuro:

```bash
supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts
```
