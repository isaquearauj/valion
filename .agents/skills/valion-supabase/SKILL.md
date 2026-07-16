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
5. Mantenha filtros explicitos por `user_id` alem da RLS.
6. Adicione teste de regressao para a regra alterada.

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

## Entrega

Resuma migrations criadas, contratos alterados, protecoes de RLS, comandos
executados e o que ainda precisa de aprovacao humana. Nao dispare nem aprove um
deploy de producao sem pedido explicito.
