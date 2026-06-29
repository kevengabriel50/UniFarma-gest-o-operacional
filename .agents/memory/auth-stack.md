---
name: Auth stack
description: Como o sistema de autenticação do UniFarma funciona — sessões, hashing e seed.
---

## Stack
- `express-session` + `bcryptjs` no api-server
- Tabela `usuarios` no PostgreSQL (id, nome, usuario, senha_hash, ativo, created_at)
- Admin (`admin`/`unifarma`) semeado automaticamente no boot via `src/lib/seed.ts`
- Frontend usa `AuthContext` (`src/lib/auth-context.tsx`) com verificação de sessão no mount via GET `/api/auth/me`

## Regra importante: zod não está instalado no api-server
- A DB lib usa `zod/v4`, mas o `@workspace/api-server` não tem zod nem zod/v4 em suas deps.
- Rotas do api-server devem usar validação manual (typeof checks) em vez de zod.

**Why:** Instalar zod no api-server duplicaria dependências e conflitaria versões.

**How to apply:** Novas rotas do api-server que precisem de validação: usar `typeof x !== "string"` ao invés de z.string(). Para schemas mais complexos, importar schemas do `@workspace/db` que já têm zod embutido.

## Session type augmentation
- Arquivo: `artifacts/api-server/src/types/session.d.ts`
- Augmenta `express-session` SessionData com `user?: { id, nome, usuario }`

## Persistência de dados operacionais
- Tasks, registros de plantão e recados foram migrados de React state (app-context) para o banco
- Tabelas: `tasks_plantao`, `registros_plantao`, `recados`
- app-context.tsx virou um wrapper vazio (não remover — App.tsx ainda importa AppProvider)
- Codegen Orval gera hooks: useListTasks, useConcluirTask, useDeleteTask, useCreateTask, useListRegistrosPlantao, useCreateRegistroPlantao, useListRecados, useCreateRecado, useDeleteRecado, useTogglePinRecado

## usuarioNome nos atendimentos
- Colunas `usuario_nome` adicionadas em `dom_atendimentos` e `contingencia_atendimentos` (nullable)
- Server injeta automaticamente do `req.session?.user?.nome` no POST de criação
- Frontend passa via `{ ...cadastroForm, usuarioNome: user?.nome ?? null }` no create
- Campo NOT editável pelo usuário (não aparece como input no formulário)
