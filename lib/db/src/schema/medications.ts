import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const medicationsTable = pgTable("medications", {
  id: serial("id").primaryKey(),
  codigoBarras: text("codigo_barras").notNull().unique(),
  codigoInterno: text("codigo_interno").notNull().unique(),
  nome: text("nome").notNull(),
  apresentacao: text("apresentacao"),
  laboratorio: text("laboratorio"),
  descricao: text("descricao"),
  estoque: integer("estoque").notNull().default(0),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMedicationSchema = createInsertSchema(medicationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateMedicationSchema = insertMedicationSchema.partial();

export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type UpdateMedication = z.infer<typeof updateMedicationSchema>;
export type Medication = typeof medicationsTable.$inferSelect;
