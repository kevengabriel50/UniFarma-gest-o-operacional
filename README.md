# UniFarma — Gestão Operacional de Farmácia Hospitalar

Sistema de gestão operacional desenvolvido para digitalizar e centralizar processos internos da farmácia hospitalar, substituindo fluxos manuais e comunicações exclusivamente orais por uma plataforma única e organizada.

O projeto surgiu a partir da observação de problemas reais no fluxo operacional da farmácia hospitalar da Unimed Londrina, cooperativa integrante de um dos maiores sistemas de saúde cooperativista do mundo.

A proposta do UniFarma é melhorar a comunicação entre plantões, reduzir perda de informações importantes e centralizar tarefas operacionais que atualmente dependem de anotações manuais, comunicação verbal ou registros descentralizados.

A execução do sistema foi acelerada com auxílio de ferramentas de Inteligência Artificial, utilizadas como suporte para prototipagem, estruturação e desenvolvimento da aplicação.

---

## Problemas Identificados

- Passagens de plantão realizadas verbalmente
- Informações importantes esquecidas entre turnos
- Controle manual de férias, folgas e treinamentos
- Falta de rastreabilidade de intercorrências
- Comunicação inconsistente sobre medicamentos em falta
- Registros importantes feitos em papel ou cadernos

---

## Funcionalidades

- Dashboard operacional com timeline de alertas e mural de avisos
- Calendário operacional com férias, folgas, treinamentos e trocas de plantão
- Passagem de plantão digital estruturada
- Registro de tasks operacionais
- Controle de medicamentos em falta ou baixo estoque
- Histórico de plantões e registros anteriores
- Feriados nacionais automáticos
- Interface inspirada em sistemas corporativos hospitalares

---

## Tecnologias Utilizadas

### Frontend
- React
- Vite
- Tailwind CSS
- shadcn/ui
- FullCalendar

### Backend
- Express.js
- TypeScript

### Banco de Dados
- PostgreSQL
- Drizzle ORM

### Outras Ferramentas
- Zod
- OpenAPI
- Orval
- pnpm workspaces

---

## Estrutura do Projeto

```txt
Frontend: artifacts/pharma-calendar/
Backend: artifacts/api-server/
Banco: lib/db/
