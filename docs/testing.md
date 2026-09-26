# Estratégia de testes

O Valion adota o **Vitest** como sua ferramenta única e unificada de testes, combinada com a **React Testing Library** para testes de componentes e asserções de DOM.

---

## 1. Estrutura de testes

O projeto organiza seus testes de acordo com o nível de isolamento:

1. **Testes unitários e de UI em `features/`:**
   - `features/finance/domain/*.test.ts`: testes rápidos e puros de cálculos, percentual comprometido, totalizadores e regras de negócio financeiras (sem dependência de DOM ou banco).
   - `features/finance/forms/*.test.ts`: testes de validação de schemas Zod e normalização de entradas numéricas/datas.
   - `features/finance/data/*.test.ts`: validação de mappers e serialização entre banco e domínio.
   - `features/*/ui/**/*.test.tsx`: testes de componentes, modais e formulários com `@testing-library/react`.
2. **Setup global ([tests/setup.ts](file:///home/isaque/dev/valion/tests/setup.ts)):**
   - Configurado via `setupFiles: ["./tests/setup.ts"]` no [vitest.config.ts](file:///home/isaque/dev/valion/vitest.config.ts).
   - Carrega as extensões de asserção do `@testing-library/jest-dom/vitest` (ex: `toBeInTheDocument()`, `toHaveTextContent()`).
3. **Testes de integração de banco ([tests/integration/supabase-rls.test.ts](file:///home/isaque/dev/valion/tests/integration/supabase-rls.test.ts)):**
   - Suíte de integração executada contra o Supabase local para validar integridade referencial, constraints e políticas de Row Level Security (RLS) entre usuários diferentes.

---

## 2. Comandos de execução

```bash
# Executa todos os testes unitários e de componentes
pnpm test

# Executa em modo interativo (watch) durante o desenvolvimento
pnpm test:watch

# Executa um arquivo ou diretório de teste específico
pnpm test features/finance/domain/calculations.test.ts

# Gera relatório de cobertura de código
pnpm test:coverage

# Executa testes de integração contra o Supabase local (requer Docker ativo)
pnpm test:supabase
```

---

## 3. Cobertura de código e thresholds

O comando `pnpm test:coverage` impõe um piso mínimo estrito de cobertura configurado em `vitest.config.ts`:

| Métrica | Threshold mínimo |
| --- | --- |
| **Statements** | 73% |
| **Lines** | 73% |
| **Functions** | 67% |
| **Branches** | 59% |

Novos módulos, refatorações e correções de bugs devem incluir testes correspondentes. Esses thresholds nunca devem ser reduzidos.

---

## 4. Quality gates

Antes de abrir commits ou pull requests, garanta a validação completa:

```bash
pnpm quality    # Biome + ESLint + Typecheck + Testes unitários
pnpm verify     # pnpm quality + Build de produção do Next.js
```
