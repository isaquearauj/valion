---
name: valion-supabase
description: Trabalhar com Supabase no Valion com seguranca e validacao completa. Use sempre que a tarefa mencionar schema, migration, SQL, RLS, Auth, perfis, service role, exclusao de conta, seed, banco local, Supabase CLI ou deploy de banco deste repositorio. Nao use para mudancas puramente visuais sem persistencia ou auth.
---

# Supabase no Valion

## Comece pelo estado real

1. Leia `AGENTS.md`, `docs/architecture.md`, `docs/supabase-setup.md` e
   `docs/security.md`.
2. Inspecione `supabase/config.toml`, as migrations existentes,
   `supabase/schema.sql` e os testes relacionados.
3. Confirme o script exato em `package.json` antes de executar comandos.
4. Verifique `git status` e preserve mudancas que nao pertencem a tarefa.

## Defina o ambiente antes de agir

- Trate `http://127.0.0.1:55321` e `http://localhost:55321` como locais.
- Pare se um comando destrutivo apontar para outro host.
- Nunca use `db reset --linked`, seed remoto, SQL arbitrario ou `db push`
  direto contra producao.
- Producao recebe apenas migrations versionadas pelo workflow manual protegido
  `.github/workflows/supabase-migrations.yml`.
- Nunca imprima, commite ou repita chaves. Leia valores de `.env.local` ou do
  ambiente sem ecoa-los.

## Para alterar banco ou auth

1. Crie uma migration nova; nao edite migrations ja aplicadas.
2. Mantenha `supabase/schema.sql` coerente como referencia consolidada.
3. Preserve constraints, cascades, triggers e policies RLS por usuario.
4. Atualize tipos de dominio, rows/mappers, schemas Zod, store e UI quando o
   contrato persistido mudar.
5. Gere `lib/supabase/database.types.ts` com `pnpm supabase:types` depois de
   aplicar as migrations locais; clientes browser/server/admin usam `Database`.
6. Mantenha filtros explicitos por `user_id` alem da RLS.
7. Adicione teste de regressao para a regra alterada.

## Storage privado e snapshots derivados

- Avatares ficam no bucket privado `profile-avatars`, com JPEG/PNG/WebP de ate
  2 MB. Policies restringem todas as operacoes ao prefixo `<auth.uid()>/`.
- Persista somente `profiles.avatar_path` e gere URL assinada para exibir. Nao
  grave base64 novo. Migracao legada valida MIME, assinatura e tamanho, e nunca
  registra o conteudo.
- Exclusao de conta remove primeiro todos os objetos do prefixo do usuario e so
  depois chama Admin Auth. A rota valida sessao e origem e retorna erros genericos.
- Snapshots sao derivados por funcoes/triggers `security definer` com
  `search_path` vazio e privilegios internos revogados. A RPC publica nao recebe
  `user_id`; deriva o dono de `auth.uid()`.
- Usuarios autenticados podem selecionar seus snapshots, mas nao escrever
  diretamente quando triggers/RPC sao os donos da integridade.
- Ao introduzir delta para registros pontuais ja existentes, inicialize antes o
  baseline apenas dos meses sem snapshot, com fatos que possam ser comprovados.
  Preserve snapshots historicos existentes sem recalculo; sem esse baseline,
  editar um registro legado pode inserir apenas a diferenca em vez do valor
  total. Cubra insercao, edicao, mudanca de mes e exclusao no Supabase local.

## Validacao local obrigatoria

Com Docker e Supabase ativos:

```bash
pnpm supabase:reset
pnpm test:supabase
```

Se a mudanca afetar a aplicacao, rode tambem:

```bash
pnpm verify
```

Relate separadamente qualquer validacao bloqueada pelo ambiente. Nao substitua
um teste real de RLS por mocks quando o comportamento pertence ao banco.

## Exclusao real de conta

- `SUPABASE_SERVICE_ROLE_KEY` fica apenas em `.env.local` e no servidor.
- A rota deve validar a sessao com `getUser()` antes de criar o cliente admin.
- Respostas ao cliente permanecem genericas; nao devolva detalhes do admin ou
  do banco.
- Valide localmente que o usuario Auth e seus dados com cascade foram removidos.
- Nunca use uma chave cloud para esse teste local.
- Depois de confirmar que a URL aponta para o Supabase local, o checklist deve
  executar `pnpm supabase:reset`, `pnpm test:supabase` e `pnpm verify`. O reset e
  obrigatorio nesse ambiente isolado; nao o proiba nem o substitua apenas por
  testes mockados.
- Remova objetos privados do Storage antes de excluir Auth e teste que falha de
  limpeza interrompe a exclusao, evitando objetos orfaos.

## Entrega

Resuma migrations criadas, contratos alterados, protecoes de RLS, comandos
executados e o que ainda precisa de aprovacao humana. Nao dispare nem aprove um
deploy de producao sem pedido explicito.
