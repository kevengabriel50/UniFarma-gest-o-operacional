import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usuariosTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { usuario, senha } = req.body as Record<string, unknown>;
    if (typeof usuario !== "string" || !usuario || typeof senha !== "string" || !senha) {
      res.status(400).json({ error: "Dados inválidos" });
      return;
    }

    const [user] = await db
      .select()
      .from(usuariosTable)
      .where(eq(usuariosTable.usuario, usuario));

    if (!user || !user.ativo) {
      res.status(401).json({ error: "Usuário ou senha inválidos" });
      return;
    }

    const valid = await bcrypt.compare(senha, user.senhaHash);
    if (!valid) {
      res.status(401).json({ error: "Usuário ou senha inválidos" });
      return;
    }

    req.session.user = { id: user.id, nome: user.nome, usuario: user.usuario };
    res.json({ id: user.id, nome: user.nome, usuario: user.usuario });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /auth/cadastro
router.post("/auth/cadastro", async (req, res) => {
  try {
    const { nome, usuario, senha } = req.body as Record<string, unknown>;
    if (
      typeof nome !== "string" || nome.length < 2 ||
      typeof usuario !== "string" || usuario.length < 3 ||
      typeof senha !== "string" || senha.length < 6
    ) {
      res.status(400).json({ error: "Dados inválidos: nome (mín 2), usuário (mín 3), senha (mín 6 caracteres)" });
      return;
    }

    const [existing] = await db
      .select()
      .from(usuariosTable)
      .where(eq(usuariosTable.usuario, usuario));

    if (existing) {
      res.status(409).json({ error: "Nome de usuário já existe" });
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const [newUser] = await db
      .insert(usuariosTable)
      .values({ nome, usuario, senhaHash, ativo: true })
      .returning();

    res.status(201).json({ id: newUser.id, nome: newUser.nome, usuario: newUser.usuario });
  } catch (err) {
    req.log.error({ err }, "Cadastro failed");
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /auth/me
router.get("/auth/me", (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  res.json(req.session.user);
});

// POST /auth/logout
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
