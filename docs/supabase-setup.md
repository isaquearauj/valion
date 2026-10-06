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

1. Acesse **Authentication > Sign In / Providers**.
2. Habilite o provider **Email** e, dentro dele:
   * *Confirm email* ligado (cadastro exige confirmação);
   * *Secure email change* ligado (a troca de e-mail exige confirmação no endereço antigo e no novo,
     equivalente a `double_confirm_changes = true` no `config.toml` local).
3. Configure **Site URL** como `https://valionapp.com`.
4. Em **Redirect URLs**, configure:

```txt
https://valionapp.com/**
https://www.valionapp.com/**
http://localhost:3000/**
```

Os fluxos do app sempre redirecionam para `/auth/callback?next=<rota>`, que troca o código PKCE pela
sessão e aceita apenas `/dashboard`, `/alterar-senha` e `/alterar-email` como destino.

### E-mails transacionais (Resend via Custom SMTP)

O Supabase continua gerando tokens e links; o Resend apenas entrega os e-mails. O domínio
`valionapp.com` deve estar verificado no Resend (DKIM/SPF/DMARC).

Em **Project Settings > Authentication > SMTP Settings**:

| Campo | Valor |
| --- | --- |
| Sender email / name | `noreply@valionapp.com` / `Valion` |
| Host / Port | `smtp.resend.com` / `465` |
| User | `resend` |
| Password | API key do Resend (somente no painel; nunca versionar) |

Em **Authentication > Rate Limits**, o envio de e-mails está em 100 por hora.

### Templates de e-mail

Os templates versionados em `supabase/templates/` são a fonte de verdade e devem ser colados em
**Authentication > Email Templates** sempre que forem alterados:

| Template | Arquivo | Assunto |
| --- | --- | --- |
| Confirm signup | `confirm-signup.html` | Confirme seu cadastro no Valion |
| Reset Password | `reset-password.html` | Redefinir sua senha no Valion |
| Change Email Address | `change-email.html` | Confirme a alteração de seu e-mail no Valion |

Os templates usam `{{ .ConfirmationURL }}`. O `config.toml` aponta para os mesmos arquivos, então o
Auth local (Mailpit) exibe exatamente o conteúdo de produção; após alterar um template, reinicie o
Supabase local (`pnpm supabase:stop && pnpm supabase:start`).

O Supabase devolve alguns avisos no fragmento da URL (`#message=...`, `#error=...`), em inglês.
`features/auth/ui/auth-link-notice.tsx` traduz os casos conhecidos para toasts em pt-BR e limpa a URL.

### Conferir a configuração de produção

Com acesso à Management API (seção 7.1), a configuração de Auth pode ser lida sem alterações:

```bash
curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/config/auth"
```

A resposta contém segredos (por exemplo, `smtp_pass`). Filtre apenas os campos necessários, como
`mailer_secure_email_change_enabled`, `site_url`, `uri_allow_list` e `rate_limit_email_sent`, e nunca
cole a resposta completa em logs, issues ou conversas.

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

### Conta de desenvolvimento

`pnpm supabase:start` cria automaticamente uma conta de teste no Auth local depois de iniciar os serviços. `pnpm supabase:reset` a recria após o reset do banco. Se o Supabase já estiver rodando, use `pnpm supabase:seed` para executar somente o seed.

- E-mail: `dev@valion.local`
- Senha: valor de `VALION_DEV_PASSWORD` no `.env.local` (gerado na primeira execução do seed).
- Login: `http://localhost:3000/login`.

O seed confirma o e-mail e é idempotente: se a conta já existir, valida o login sem trocar sua senha. Também adiciona receitas, despesas, investimentos, metas, aportes, lembretes e cinco meses fechados fictícios à conta de desenvolvimento. Os valores do mês atual são recalculados pelos triggers do banco; os meses fechados fornecem variedade para os gráficos da Visão Geral e do Histórico. Rodar `pnpm supabase:seed` novamente só inclui registros ausentes, sem apagar ou sobrescrever edições existentes. A senha e as chaves ficam apenas no `.env.local`, ignorado pelo Git; nunca as copie para documentação versionada. O script recusa URLs que não apontem para a API local do Valion (`localhost:55321`).

Em um banco local recém-criado, o exemplo exibe R$ 8.100,00 de receitas mensais, R$ 5.481,00 de despesas ativas (incluindo dois consórcios), R$ 1.500,00 planejados para investimento e R$ 1.119,00 livres após o plano no mês corrente. Esses números são fictícios e podem mudar conforme você editar os registros. O endereço da Visão Geral permanece `/dashboard`.

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

### 7.1 Acesso local à Management API (leitura)

Para inspecionar a configuração de produção (Auth, SMTP, rate limits, estado do projeto) a partir da
máquina local:

1. Gere um Personal Access Token em **supabase.com/dashboard/account/tokens**, restrito ao projeto
   Valion e com validade definida.
2. Exporte-o no ambiente do shell, fora do repositório (por exemplo, no perfil do shell com permissão
   restrita ao usuário):

```bash
export SUPABASE_ACCESS_TOKEN="<token>"
export SUPABASE_PROJECT_REF="<project-ref>"   # parte da URL https://<project-ref>.supabase.co
```

3. Confirme o escopo: `GET https://api.supabase.com/v1/projects` deve listar somente o Valion.

Regras:

* O uso padrão é **somente leitura**. Qualquer alteração de configuração em produção exige
  autorização explícita do responsável pelo projeto.
* Migrations continuam exclusivamente pelo workflow (seção 7); o token local não substitui esse fluxo.
* Nunca registre o token ou respostas completas da API em commits, logs, issues ou conversas.
* Revogue o token na mesma página quando não for mais necessário ou se houver suspeita de exposição.

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
