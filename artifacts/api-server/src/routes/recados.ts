import { Router } from "express";
import { db, recadosTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/recados", async (req, res) => {
  try {
    const recados = await db.select().from(recadosTable).orderBy(desc(recadosTable.createdAt));
    res.json(recados);
  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/recados", async (req, res) => {
  try {
    const { author, content } = req.body as Record<string, unknown>;
    if (typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "Conteúdo obrigatório" });
      return;
    }
    const [recado] = await db.insert(recadosTable).values({
      author: typeof author === "string" && author.trim() ? author.trim() : "Anônimo",
      content: content.trim(),
      pinned: false,
    }).returning();
    res.status(201).json(recado);
  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/recados/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(recadosTable).where(eq(recadosTable.id, id));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.patch("/recados/:id/pin", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(recadosTable).where(eq(recadosTable.id, id));
    if (!existing) { res.status(404).json({ error: "Não encontrado" }); return; }
    const [updated] = await db
      .update(recadosTable)
      .set({ pinned: !existing.pinned })
      .where(eq(recadosTable.id, id))
      .returning();
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
