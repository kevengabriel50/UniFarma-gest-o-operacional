import bcrypt from "bcryptjs";
import { db, usuariosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

async function seedUser(nome: string, usuario: string, senha: string): Promise<void> {
  const [existing] = await db
    .select()
    .from(usuariosTable)
    .where(eq(usuariosTable.usuario, usuario));

  if (!existing) {
    const senhaHash = await bcrypt.hash(senha, 10);
    await db.insert(usuariosTable).values({ nome, usuario, senhaHash, ativo: true });
    logger.info(`User "${usuario}" seeded successfully`);
  }
}

export async function seedAdminUser(): Promise<void> {
  try {
    await seedUser("Administrador", "admin", "unifarma");

    if (process.env.SEED_DEMO_USER === "true") {
      await seedUser("Demonstração", "demo", "demo123");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed users");
  }
}
