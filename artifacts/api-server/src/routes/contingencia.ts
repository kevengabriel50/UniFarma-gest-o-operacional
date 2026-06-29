import { Router } from "express";
import {
  db,
  contingenciaAtendimentosTable,
  contingenciaItensTable,
  insertContingenciaAtendimentoSchema,
  insertContingenciaItemSchema,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// ── Atendimentos ─────────────────────────────────────────────────────────────

router.get("/contingencia/atendimentos", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(contingenciaAtendimentosTable)
      .orderBy(contingenciaAtendimentosTable.createdAt);

    res.json(rows.map(serializeAtendimento).reverse());
  } catch (err) {
    req.log.error({ err }, "Failed to list Contingência atendimentos");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/contingencia/atendimentos", async (req, res) => {
  try {
    const parsed = insertContingenciaAtendimentoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }
    const usuarioNome = req.session?.user?.nome ?? null;
    const [row] = await db.insert(contingenciaAtendimentosTable).values({ ...parsed.data, usuarioNome }).returning();
    res.status(201).json(serializeAtendimento(row));
  } catch (err) {
    req.log.error({ err }, "Failed to create Contingência atendimento");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/contingencia/atendimentos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [atendimento] = await db
      .select()
      .from(contingenciaAtendimentosTable)
      .where(eq(contingenciaAtendimentosTable.id, id));
    if (!atendimento) {
      res.status(404).json({ error: "Atendimento not found" });
      return;
    }
    const itens = await db
      .select()
      .from(contingenciaItensTable)
      .where(eq(contingenciaItensTable.atendimentoId, id));

    res.json({ ...serializeAtendimento(atendimento), itens: itens.map(serializeItem) });
  } catch (err) {
    req.log.error({ err }, "Failed to get Contingência atendimento");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/contingencia/atendimentos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = insertContingenciaAtendimentoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }
    const [row] = await db
      .update(contingenciaAtendimentosTable)
      .set(parsed.data)
      .where(eq(contingenciaAtendimentosTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Atendimento not found" });
      return;
    }
    res.json(serializeAtendimento(row));
  } catch (err) {
    req.log.error({ err }, "Failed to update Contingência atendimento");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/contingencia/atendimentos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db.delete(contingenciaItensTable).where(eq(contingenciaItensTable.atendimentoId, id));
    const [deleted] = await db
      .delete(contingenciaAtendimentosTable)
      .where(eq(contingenciaAtendimentosTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Atendimento not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete Contingência atendimento");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/contingencia/atendimentos/:id/finalizar", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [row] = await db
      .update(contingenciaAtendimentosTable)
      .set({ status: "finalizado" })
      .where(eq(contingenciaAtendimentosTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Atendimento not found" });
      return;
    }
    res.json(serializeAtendimento(row));
  } catch (err) {
    req.log.error({ err }, "Failed to finalize Contingência atendimento");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/contingencia/atendimentos/:id/reabrir", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [row] = await db
      .update(contingenciaAtendimentosTable)
      .set({ status: "em_andamento" })
      .where(eq(contingenciaAtendimentosTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Atendimento not found" });
      return;
    }
    res.json(serializeAtendimento(row));
  } catch (err) {
    req.log.error({ err }, "Failed to reopen Contingência atendimento");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Itens ────────────────────────────────────────────────────────────────────

router.post("/contingencia/atendimentos/:id/itens", async (req, res) => {
  try {
    const atendimentoId = Number(req.params.id);
    if (!Number.isInteger(atendimentoId) || atendimentoId <= 0) {
      res.status(400).json({ error: "Invalid atendimento id" });
      return;
    }
    const parsed = insertContingenciaItemSchema.safeParse({ ...req.body, atendimentoId });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }
    const [item] = await db.insert(contingenciaItensTable).values(parsed.data).returning();
    res.status(201).json(serializeItem(item));
  } catch (err) {
    req.log.error({ err }, "Failed to add Contingência item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/contingencia/atendimentos/:atendimentoId/itens/:itemId", async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      res.status(400).json({ error: "Invalid item id" });
      return;
    }
    const [deleted] = await db
      .delete(contingenciaItensTable)
      .where(eq(contingenciaItensTable.id, itemId))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete Contingência item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Serializers ──────────────────────────────────────────────────────────────

function serializeAtendimento(a: typeof contingenciaAtendimentosTable.$inferSelect) {
  return { ...a, createdAt: a.createdAt.toISOString() };
}

function serializeItem(i: typeof contingenciaItensTable.$inferSelect) {
  return { ...i, createdAt: i.createdAt.toISOString() };
}

export default router;
