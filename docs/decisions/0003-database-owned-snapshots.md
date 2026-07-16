# 0003 — Snapshots financeiros derivados pelo banco

## Status

Aceita.

## Contexto

Histórico recorrente não pode ser reconstruído com precisão a partir dos cadastros atuais. Permitir
que o cliente escreva snapshots também cria risco de drift e manipulação de dados derivados.

## Decisão

Postgres é dono de `monthly_snapshots`. Funções e triggers atualizam o mês corrente e aplicam apenas
correções históricas comprováveis. A RPC pública deriva o usuário de `auth.uid()` e clientes
autenticados não possuem escrita direta.

## Consequências

- snapshots existentes são preservados;
- renda única histórica usa delta no mês recebido;
- investimento passado altera somente seus campos;
- regras exigem testes reais no Supabase local e cuidado com cascades de exclusão.
