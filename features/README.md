# Features

O Valion organiza regras de produto por feature. Cada módulo é dono de seu domínio, fluxo de dados
e UI; infraestrutura genérica permanece em `lib` e primitives visuais em `components/ui`.

## Quando criar uma feature

Crie `features/<nome>` quando houver comportamento de produto com vocabulário, regras ou lifecycle
próprios. Não crie uma feature apenas para agrupar dois arquivos utilitários.

Uma feature complexa pode usar estas camadas:

```text
feature/
├── README.md       # propósito, fronteiras, fluxos e invariantes
├── domain/         # regras e tipos puros
├── forms/          # validação e normalização
├── data/           # mappers e repositórios
├── hooks/          # implementação de estado
├── providers/      # contrato/contexto compartilhado
├── presentation/   # view models e formatação
└── ui/             # componentes, rotas e shell
```

Nem toda feature precisa de todas as pastas. Comece com o menor desenho suficiente e extraia uma
camada quando ela ganhar uma responsabilidade real.

## Fronteiras

- `app` compõe rotas; não concentra regra de domínio.
- `domain` não depende de React, Next.js ou Supabase.
- `data` conhece banco e traduz para o domínio.
- `ui` usa contratos da feature e não monta payload SQL.
- Código compartilhado só sai da feature quando existir mais de um consumidor real.
- Evite barrels amplos e dependências circulares entre features.

## README de módulo

Adicione README quando o módulo tiver múltiplas camadas, persistência, invariantes sensíveis ou um
workflow difícil de inferir. O README deve explicar:

- o que o módulo possui e o que não possui;
- fluxo de dados e dependências permitidas;
- invariantes de produto/segurança;
- pontos seguros de extensão;
- comandos e testes específicos.

Não replique documentação linha a linha do código.
