import bcrypt from "bcryptjs";
import { db, usuariosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export async function seedAdminUser(): Promise<void> {
  try {
    const [existing] = await db
      .select()
      .from(usuariosTable)
      .where(eq(usuariosTable.usuario, "admin"));

    if (!existing) {
      const senhaHash = await bcrypt.hash("unifarma", 10);
      await db.insert(usuariosTable).values({
        nome: "Administrador",
        usuario: "admin",
        senhaHash,
        ativo: true,
      });
      logger.info("Admin user seeded successfully");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed admin user");
  }
}
