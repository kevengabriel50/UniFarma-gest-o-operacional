# UniFarma — Gestão Operacional de Farmácia Hospitalar

Sistema de gestão operacional desenvolvido para a Cooperativa Unimed, com o objetivo de digitalizar e centralizar processos que hoje são feitos de forma oral e manual na farmácia hospitalar.

## Origem do Projeto

Desenvolvido por um farmacêutico da Unimed que identificou problemas reais no fluxo de trabalho da equipe:

- **Passagens de plantão orais** — informações importantes se perdem na correria
- **Calendário de papel** — férias, folgas e treinamentos anotados com rasuras ao alterar datas
- **Falta de medicamentos não comunicada** — problemas em lotes ou equipamentos esquecidos de registrar
- **Informações não retidas** — mesmo quando comunicadas verbalmente, a equipe esquecia

A ideia central foi unir todas essas soluções em uma plataforma única. O escopo foi planejado pelo próprio autor; a execução foi feita com ferramentas de Inteligência Artificial, incluindo wireframes básicos como referência de design. O objetivo era testar o quanto é possível aplicar uma solução para um problema real, o mais rápido possível, usando IA.

## Funcionalidades

- **Dashboard** — timeline de alertas para eventos próximos (até 7 dias: folgas, férias, feriados, treinamentos) + mural de recados da equipe com fixação
- **Calendário Operacional** — agenda digital com 5 categorias de eventos (férias, folga, afastamento, troca de plantão, treinamento), drag-and-drop, feriados nacionais automáticos
- **Passagem de Plantão** — formulário digital estruturado com tasks do turno, registro de intercorrências, status de leitos e medicamentos em falta
- **Tasks** — registro de tarefas confirmadas durante os plantões
- **Medicamentos** — controle de itens em falta ou com baixo estoque
- **Histórico** — arquivo de todas as passagens de plantão salvas

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — rodar o servidor de API (porta 5000)
- `pnpm run typecheck` — verificar tipos em todos os pacotes
- `pnpm run build` — typecheck + build
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks e schemas do OpenAPI
- `pnpm --filter @workspace/db run push` — aplicar mudanças no schema do banco (dev only)
- Variável de ambiente necessária: `DATABASE_URL` — string de conexão Postgres

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + FullCalendar
- API: Express 5
- Banco de Dados: PostgreSQL + Drizzle ORM
- Validação: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (a partir do spec OpenAPI)
- Build: esbuild (bundle CJS)

## Where things live

- `artifacts/pharma-calendar/` — frontend React/Vite
  - `src/pages/` — páginas da aplicação
  - `src/components/layout/` — sidebar e layout principal
  - `src/lib/app-context.tsx` — estado global compartilhado (tasks, plantões, recados)
  - `src/lib/holidays.ts` — feriados nacionais brasileiros (calculados dinamicamente)
  - `src/lib/calendar-utils.ts` — cores e labels das categorias de eventos
- `artifacts/api-server/` — backend Express
- `lib/api-client-react/` — hooks React Query gerados via Orval
- `lib/db/` — schema Drizzle ORM

## Credenciais de demonstração

- Usuário: `admin`
- Senha: `unifarma`

## User preferences

- Idioma: Português (pt-BR) em toda a interface
- Tema: verde Unimed (`#00995D`, `#007A48`) com fundo branco
- Sem emojis na interface — visual limpo e profissional

## Architecture decisions

- Estado global via React Context (não Redux) — suficiente para o escopo atual
- Dados de passagem de plantão mantidos em memória na sessão (sem persistência em banco ainda)
- Feriados calculados localmente em `holidays.ts` — sem dependência de API externa
- Login hardcoded no frontend para demonstração — sem backend de autenticação por enquanto

## Gotchas

- Não rodar `pnpm dev` na raiz — usar os workflows individuais por artefato
- O banco de dados persiste apenas eventos do calendário; tasks e plantões estão em estado React (memória de sessão)
