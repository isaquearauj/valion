# Configuração do Supabase

Este projeto usa Supabase em produção e localmente para autenticação, perfis de usuário, armazenamento de avatares privados e persistência financeira com Row Level Security (RLS) por usuário.

---

## 1. Criar o projeto no Supabase Cloud

1. Acesse `https://supabase.com/dashboard`.
2. Crie uma organização ou use uma existente.
3. Crie um novo projeto.
4. Defina região, nome e senha forte para o banco.

---

## 2. Schema e migrations

O banco de dados é versionado exclusivamente a partir de migrations em [supabase/migrations/](file:///home/isaque/dev/valion/supabase/migrations). O arquivo [supabase/schema.sql](file:///home/isaque/dev/valion/supabase/schema.sql) é a referência consolidada do schema, enquanto as migrations representam o histórico sequencial de mudanças.

---

## 3. Configurar autenticação em produção

1. Acesse **Authentication > Providers**.
2. Habilite o provider **Email**.
3. Habilite a confirmação de e-mail (*Confirm email*).
4. Configure **Site URL** como `https://valionapp.com`.
5. Em **Redirect URLs**, configure:

```txt
https://valionapp.com/**
https://www.valionapp.com/**
http://localhost:3000/**
```

---

## 4. Ambiente local (Docker + CLI)

O desenvolvimento local do Supabase roda através da CLI oficial gerenciada pelo Docker:

```bash
pnpm supabase:start    # Inicia os containers locais
pnpm supabase:status   # Exibe portas, URLs e chaves locais
pnpm supabase:stop     # Para os containers locais para poupar recursos
```

### Portas e serviços locais:

* **PostgreSQL:** `http://127.0.0.1:55322`
* **API (PostgREST / Auth):** `http://127.0.0.1:55321`
* **Supabase Studio:** `http://127.0.0.1:55323`
* **Mailpit (Inbucket):** `http://127.0.0.1:55324`

> [!NOTE]
> E-mails de confirmação e recuperação de senha enviados localmente chegam diretamente no **Mailpit** (`http://127.0.0.1:55324`), permitindo testar fluxos sem enviar e-mails reais ou consumir cotas do Supabase Cloud.

### Variáveis de ambiente locais (`.env.local`)

Preencha o arquivo `.env.local` na raiz do projeto com os valores exibidos por `pnpm supabase:status`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key-local>
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key-local>
```

### Reset do banco local

Para recriar o banco do zero aplicando todas as migrations:

```bash
pnpm supabase:reset
```

### Testes de RLS e integridade

Para executar a suíte de testes de integração contra as tabelas e regras RLS locais:

```bash
pnpm test:supabase
```

### Regeneração de tipos TypeScript

Após criar ou alterar uma migration local, regenere o contrato de tipagem em `lib/supabase/database.types.ts`:

```bash
pnpm supabase:types
```

---

## 5. Exclusão real de conta e integridade

A rota `DELETE /api/account` utiliza a `SUPABASE_SERVICE_ROLE_KEY` exclusivamente server-side para remover o usuário do Supabase Auth.
* As tabelas financeiras utilizam `ON DELETE CASCADE` vinculadas a `auth.users(id)`, garantindo que todos os registros vinculados sejam limpos automaticamente.
* Antes da exclusão do usuário Auth, a rota esvazia o bucket de avatares privados do usuário correspondente para não deixar arquivos órfãos.

---

## 6. Deploy na Vercel

1. Conecte o repositório à Vercel.
2. Em **Settings > Environment Variables**, adicione as seguintes variáveis com os valores do seu projeto Supabase Cloud:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY` (marcada como apenas Server / não exposta no client)
3. Configure `valionapp.com` como domínio principal e `www.valionapp.com` como redirecionamento para o domínio raiz.

---

## 7. Pipeline de migrations de produção

* O deploy de migrations para produção é automatizado pelo GitHub Actions em `.github/workflows/supabase-migrations.yml`.
* O workflow executa exclusivamente após um `push` bem-sucedido na branch `main` onde o job de CI tenha passado com sucesso.
* Secrets necessários no GitHub Environment `production`:
  * `SUPABASE_ACCESS_TOKEN`
  * `SUPABASE_DB_PASSWORD`
  * `SUPABASE_PROJECT_REF`
* **Nunca execute `supabase db push` diretamente contra o banco de produção.**

---

## 8. Avatares privados no Supabase Storage

* Bucket: `profile-avatars` (privado).
* Formatos aceitos: JPEG, PNG e WebP até 2 MB.
* Caminho do objeto: `<user-id>/<uuid>.<ext>`.
* As policies de RLS do bucket validam o primeiro segmento do caminho contra `auth.uid()`.
* A tabela `profiles` armazena apenas o `avatar_path`; a aplicação gera URLs assinadas temporárias com validade curta para exibição.

---

## 9. Troubleshooting e problemas comuns

| Problema | Causa provável | Solução |
| --- | --- | --- |
| `Cannot connect to the Docker daemon` ao rodar `supabase:start` | Docker Desktop não está rodando ou integração com WSL está desativada. | Inicie o Docker Desktop e verifique se a distribuição WSL está marcada em *Settings > Resources > WSL Integration*. |
| Erro de porta já em uso (`bind: address already in use`) | Outro serviço ou container antigo está ocupando as portas `55321` a `55324`. | Rode `pnpm supabase:stop` ou mate processos nas portas `55321-55324` antes de iniciar novamente. |
| Inconsistência de schema local ou erro de migration | O banco local possui alterações divergentes das migrations versionadas. | Execute `pnpm supabase:reset` para recriar o banco do zero a partir do histórico limpo de migrations. |
| Erros de tipos no TypeScript após migration | `database.types.ts` está desatualizado em relação ao banco local. | Com o Supabase local rodando, execute `pnpm supabase:types`. |
