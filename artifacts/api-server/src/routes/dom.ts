import { Router } from "express";
import { db, domAtendimentosTable, domItensTable, insertDomAtendimentoSchema, insertDomItemSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// ── Atendimentos ─────────────────────────────────────────────────────────────

router.get("/dom/atendimentos", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(domAtendimentosTable)
      .orderBy(domAtendimentosTable.createdAt);

    res.json(rows.map(serializeAtendimento).reverse());
  } catch (err) {
    req.log.error({ err }, "Failed to list DOM atendimentos");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/dom/atendimentos", async (req, res) => {
  try {
    const parsed = insertDomAtendimentoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }
    const [row] = await db.insert(domAtendimentosTable).values(parsed.data).returning();
    res.status(201).json(serializeAtendimento(row));
  } catch (err) {
    req.log.error({ err }, "Failed to create DOM atendimento");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dom/atendimentos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [atendimento] = await db
      .select()
      .from(domAtendimentosTable)
      .where(eq(domAtendimentosTable.id, id));
    if (!atendimento) {
      res.status(404).json({ error: "Atendimento not found" });
      return;
    }
    const itens = await db
      .select()
      .from(domItensTable)
      .where(eq(domItensTable.atendimentoId, id));

    res.json({ ...serializeAtendimento(atendimento), itens: itens.map(serializeItem) });
  } catch (err) {
    req.log.error({ err }, "Failed to get DOM atendimento");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/dom/atendimentos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = insertDomAtendimentoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }
    const [row] = await db
      .update(domAtendimentosTable)
      .set(parsed.data)
      .where(eq(domAtendimentosTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Atendimento not found" });
      return;
    }
    res.json(serializeAtendimento(row));
  } catch (err) {
    req.log.error({ err }, "Failed to update DOM atendimento");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/dom/atendimentos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db.delete(domItensTable).where(eq(domItensTable.atendimentoId, id));
    const [deleted] = await db
      .delete(domAtendimentosTable)
      .where(eq(domAtendimentosTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Atendimento not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete DOM atendimento");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/dom/atendimentos/:id/finalizar", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [row] = await db
      .update(domAtendimentosTable)
      .set({ status: "finalizado" })
      .where(eq(domAtendimentosTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Atendimento not found" });
      return;
    }
    res.json(serializeAtendimento(row));
  } catch (err) {
    req.log.error({ err }, "Failed to finalize DOM atendimento");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Itens ────────────────────────────────────────────────────────────────────

router.post("/dom/atendimentos/:id/itens", async (req, res) => {
  try {
    const atendimentoId = Number(req.params.id);
    if (!Number.isInteger(atendimentoId) || atendimentoId <= 0) {
      res.status(400).json({ error: "Invalid atendimento id" });
      return;
    }
    const parsed = insertDomItemSchema.safeParse({ ...req.body, atendimentoId });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }
    const [item] = await db.insert(domItensTable).values(parsed.data).returning();
    res.status(201).json(serializeItem(item));
  } catch (err) {
    req.log.error({ err }, "Failed to add DOM item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/dom/atendimentos/:atendimentoId/itens/:itemId", async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      res.status(400).json({ error: "Invalid item id" });
      return;
    }
    const [deleted] = await db
      .delete(domItensTable)
      .where(eq(domItensTable.id, itemId))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete DOM item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Serializers ──────────────────────────────────────────────────────────────

function serializeAtendimento(a: typeof domAtendimentosTable.$inferSelect) {
  return { ...a, createdAt: a.createdAt.toISOString() };
}

function serializeItem(i: typeof domItensTable.$inferSelect) {
  return { ...i, createdAt: i.createdAt.toISOString() };
}

export default router;
