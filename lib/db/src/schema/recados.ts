import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recadosTable = pgTable("recados", {
  id: serial("id").primaryKey(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRecadoSchema = createInsertSchema(recadosTable).omit({
  id: true,
  createdAt: true,
});
export const updateRecadoSchema = insertRecadoSchema.partial();

export type InsertRecado = z.infer<typeof insertRecadoSchema>;
export type UpdateRecado = z.infer<typeof updateRecadoSchema>;
export type Recado = typeof recadosTable.$inferSelect;
