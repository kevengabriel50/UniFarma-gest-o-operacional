---
name: Shared AtendimentoModulePage
description: Padrão de componente genérico compartilhado entre módulos DOM e Contingência.
---

## Regra
Novos módulos de atendimento (DOM, Contingência, e futuros) devem usar o componente `AtendimentoModulePage` em `artifacts/pharma-calendar/src/components/atendimento/AtendimentoModulePage.tsx`.

## Como funciona
- O componente genérico recebe `moduleLabel: string` e `hooks: AtendimentoModuleHooks` como props.
- Os hooks Orval têm tipos incompatíveis com a interface local → usar `as any` nos wrappers (`DomPage.tsx`, `ContingenciaPage.tsx`).
- A interface define hooks como `(...args: any[]) => { returnShape }` para aceitar os generics do Orval sem conflito.

**Why:** Evita duplicar ~800 linhas de UI para cada módulo novo.

**How to apply:** Criar um `XPage.tsx` que instancia `AtendimentoModuleHooks` com os hooks gerados + query keys, e renderiza `<AtendimentoModulePage moduleLabel="X" hooks={xHooks} />`.
