# Segurança

Este projeto trata dados financeiros pessoais. Tokens, senhas e chaves nunca
devem aparecer em commits, logs, mensagens, arquivos de configuração
versionados ou componentes client-side.

O `SUPABASE_SERVICE_ROLE_KEY` permanece somente no servidor. Credenciais da
CLI são gerenciadas por `supabase login` no armazenamento nativo da máquina.
Não é necessário `.env.supabase`; o arquivo continua ignorado para proteger
contra criação acidental. Runners efêmeros usam secrets ou secret manager.

Produção é protegida pelo GitHub Environment `production`. O workflow manual
usa apenas `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` e
`SUPABASE_PROJECT_REF` desse environment, com `contents: read`, e aplica apenas
migrations versionadas. Seed, `supabase db reset --linked`, SQL arbitrário e
`supabase db push` direto contra produção são proibidos.

Para mudanças destrutivas, faça backup e valide localmente. Não edite
migrations aplicadas; publique uma migration corretiva para rollback ou ajuste.
