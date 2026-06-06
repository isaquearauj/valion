# Configuração do Supabase

Este projeto já possui base de interface, autenticação e dados preparada para receber persistência real no Supabase.

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
3. Em desenvolvimento, configure a URL do site como `http://localhost:3000`.
4. Para produção na Vercel, adicione a URL final em `Site URL` e `Redirect URLs`.

## 4. Criar `.env.local`

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

As chaves ficam em `Project Settings > API`.

## 5. Próxima etapa de implementação

O app já possui clientes em `lib/supabase/client.ts` e `lib/supabase/server.ts`.

Para conectar a aplicação ao banco real:

1. Substituir `useFinanceStore` por queries no Supabase.
2. Conectar `AuthScreen` a `supabase.auth.signInWithPassword`, `signUp`, `resetPasswordForEmail` e `signOut`.
3. Criar rotas protegidas usando sessão do Supabase no servidor.
4. Mapear campos camelCase do frontend para snake_case do banco.
5. Gerar tipos com `supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts`.

## 6. Deploy na Vercel

1. Suba o projeto para um repositório Git.
2. Importe o projeto na Vercel.
3. Adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `Settings > Environment Variables`.
4. Faça o deploy.
