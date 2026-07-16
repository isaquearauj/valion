# Segurança

Este projeto trata dados financeiros pessoais. Tokens, senhas e chaves nunca
devem aparecer em commits, logs, mensagens, arquivos de configuração
versionados ou componentes client-side.

O `SUPABASE_SERVICE_ROLE_KEY` permanece somente no servidor. Credenciais da
CLI são gerenciadas por `supabase login` no armazenamento nativo da máquina.
Não é necessário `.env.supabase`; o arquivo continua ignorado para proteger
contra criação acidental. Runners efêmeros usam secrets ou secret manager.

Produção usa o GitHub Environment `production`. O workflow manual pode ser
disparado por um agente autorizado e usa apenas `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` e
`SUPABASE_PROJECT_REF` desse environment, com `contents: read`, e aplica apenas
migrations versionadas. Seed, `supabase db reset --linked`, SQL arbitrário e
`supabase db push` direto contra produção são proibidos.

Para mudanças destrutivas, faça backup e valide localmente. Não edite
migrations aplicadas; publique uma migration corretiva para rollback ou ajuste.

Avatares nunca são públicos: somente `avatar_path` é persistido e a imagem é
exibida por URL assinada. Policies do bucket limitam select/insert/update/delete
ao prefixo do próprio usuário e o bucket rejeita MIME ou tamanho fora do
contrato. Base64 legado é validado sem logs e removido após migração ou rejeição.

Snapshots financeiros são escritos apenas por funções/triggers internas com
`security definer`, `search_path` vazio e privilégios revogados. A RPC pública
não recebe `user_id`; usa a sessão autenticada. Usuários têm somente leitura dos
próprios snapshots via RLS.

`DELETE /api/account` exige origem igual à aplicação, valida `getUser()`, limpa
Storage e só então usa a service role para excluir Auth. Erros ao cliente são
genéricos e não revelam chaves, SQL ou nomes de objetos.
