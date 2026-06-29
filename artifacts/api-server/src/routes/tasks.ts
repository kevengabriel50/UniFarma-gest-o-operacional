import { Router } from "express";
import { db, tasksPlantaoTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await db
      .select()
      .from(tasksPlantaoTable)
      .orderBy(desc(tasksPlantaoTable.createdAt));
    res.json(tasks);
  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const { titulo, prioridade } = req.body as Record<string, unknown>;
    if (typeof titulo !== "string" || !titulo.trim()) {
      res.status(400).json({ error: "Título obrigatório" });
      return;
    }
    const validPrioridades = ["Alta", "Média", "Baixa"];
    const p = typeof prioridade === "string" && validPrioridades.includes(prioridade)
      ? (prioridade as "Alta" | "Média" | "Baixa")
      : "Média";

    const [task] = await db.insert(tasksPlantaoTable).values({ titulo: titulo.trim(), prioridade: p }).returning();
    res.status(201).json(task);
  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(tasksPlantaoTable).where(eq(tasksPlantaoTable.id, id));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.patch("/tasks/:id/concluir", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [task] = await db
      .update(tasksPlantaoTable)
      .set({ concluida: true, concluidaEm: new Date() })
      .where(eq(tasksPlantaoTable.id, id))
      .returning();
    if (!task) { res.status(404).json({ error: "Não encontrado" }); return; }
    res.json(task);
  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
