import { Router } from "express";
import { db, registrosPlantaoTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/registros-plantao", async (req, res) => {
  try {
    const registros = await db
      .select()
      .from(registrosPlantaoTable)
      .orderBy(desc(registrosPlantaoTable.savedAt));
    res.json(registros);
  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/registros-plantao", async (req, res) => {
  try {
    const { farmaceutico, turno, data, statusLeitos, intercorrencias, observacoes } = req.body as Record<string, unknown>;
    if (typeof turno !== "string" || !turno || typeof data !== "string" || !data) {
      res.status(400).json({ error: "Turno e data são obrigatórios" });
      return;
    }
    const [registro] = await db.insert(registrosPlantaoTable).values({
      farmaceutico: typeof farmaceutico === "string" ? farmaceutico : "",
      turno,
      data,
      statusLeitos: typeof statusLeitos === "string" ? statusLeitos : "",
      intercorrencias: typeof intercorrencias === "string" ? intercorrencias : "",
      observacoes: typeof observacoes === "string" ? observacoes : "",
    }).returning();
    res.status(201).json(registro);
  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
