---
name: Query key readonly types
description: Orval gera query keys como readonly tuples — incompatível com unknown[] mutável.
---

## Regra
Ao definir interfaces que aceitam query key getters do Orval, usar `readonly unknown[]` (não `unknown[]`).

**Why:** Orval gera `readonly ["/api/..."]` (const tuple readonly). Atribuir a `unknown[]` mutável causa TS2322.

**How to apply:** Em qualquer interface que inclua `listQueryKey` ou `detailQueryKey`, tipar como:
```typescript
listQueryKey: () => readonly unknown[];
detailQueryKey: (id: number) => readonly unknown[];
```
