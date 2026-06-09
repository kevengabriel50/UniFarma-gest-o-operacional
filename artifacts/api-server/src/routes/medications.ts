import { Router } from "express";
import { db, medicationsTable, insertMedicationSchema, updateMedicationSchema } from "@workspace/db";
import { eq, or, ilike } from "drizzle-orm";

const router = Router();

router.get("/medications", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;

    const rows = q
      ? await db
          .select()
          .from(medicationsTable)
          .where(
            or(
              ilike(medicationsTable.nome, `%${q}%`),
              ilike(medicationsTable.codigoBarras, `%${q}%`),
              ilike(medicationsTable.codigoInterno, `%${q}%`),
              ilike(medicationsTable.laboratorio, `%${q}%`)
            )
          )
          .orderBy(medicationsTable.nome)
      : await db.select().from(medicationsTable).orderBy(medicationsTable.nome);

    res.json(rows.map(serializeMed));
  } catch (err) {
    req.log.error({ err }, "Failed to list medications");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/medications/barcode/:codigoBarras", async (req, res) => {
  try {
    const codigoBarras = req.params.codigoBarras;
    if (!codigoBarras) {
      res.status(400).json({ error: "Invalid barcode" });
      return;
    }
    const [med] = await db
      .select()
      .from(medicationsTable)
      .where(eq(medicationsTable.codigoBarras, codigoBarras));
    if (!med) {
      res.status(404).json({ error: "Medication not found" });
      return;
    }
    res.json(serializeMed(med));
  } catch (err) {
    req.log.error({ err }, "Failed to lookup medication by barcode");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/medications", async (req, res) => {
  try {
    const parsed = insertMedicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }
    const [med] = await db
      .insert(medicationsTable)
      .values(parsed.data)
      .returning();
    res.status(201).json(serializeMed(med));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique")) {
      res.status(409).json({ error: "Código de barras ou código interno já cadastrado" });
      return;
    }
    req.log.error({ err }, "Failed to create medication");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/medications/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = updateMedicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }
    const [med] = await db
      .update(medicationsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(medicationsTable.id, id))
      .returning();
    if (!med) {
      res.status(404).json({ error: "Medication not found" });
      return;
    }
    res.json(serializeMed(med));
  } catch (err) {
    req.log.error({ err }, "Failed to update medication");
    res.status(500).json({ error: "Internal server error" });
  }
});

function serializeMed(m: typeof medicationsTable.$inferSelect) {
  return {
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

export default router;
