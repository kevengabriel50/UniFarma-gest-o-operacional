import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contingenciaStatusEnum = pgEnum("contingencia_status", ["em_andamento", "finalizado"]);

export const contingenciaAtendimentosTable = pgTable("contingencia_atendimentos", {
  id: serial("id").primaryKey(),
  nomePaciente: text("nome_paciente").notNull(),
  numeroAtendimento: text("numero_atendimento").notNull(),
  data: text("data").notNull(),
  observacoes: text("observacoes"),
  status: contingenciaStatusEnum("status").notNull().default("em_andamento"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contingenciaItensTable = pgTable("contingencia_itens", {
  id: serial("id").primaryKey(),
  atendimentoId: integer("atendimento_id").notNull().references(() => contingenciaAtendimentosTable.id),
  codigoBarras: text("codigo_barras").notNull(),
  codigoInterno: text("codigo_interno").notNull(),
  nome: text("nome").notNull(),
  lote: text("lote").notNull(),
  quantidade: integer("quantidade").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContingenciaAtendimentoSchema = createInsertSchema(contingenciaAtendimentosTable).omit({
  id: true,
  createdAt: true,
});
export const updateContingenciaAtendimentoSchema = insertContingenciaAtendimentoSchema.partial();

export const insertContingenciaItemSchema = createInsertSchema(contingenciaItensTable).omit({
  id: true,
  createdAt: true,
});
export const updateContingenciaItemSchema = insertContingenciaItemSchema.partial();

export type InsertContingenciaAtendimento = z.infer<typeof insertContingenciaAtendimentoSchema>;
export type UpdateContingenciaAtendimento = z.infer<typeof updateContingenciaAtendimentoSchema>;
export type ContingenciaAtendimento = typeof contingenciaAtendimentosTable.$inferSelect;

export type InsertContingenciaItem = z.infer<typeof insertContingenciaItemSchema>;
export type UpdateContingenciaItem = z.infer<typeof updateContingenciaItemSchema>;
export type ContingenciaItem = typeof contingenciaItensTable.$inferSelect;
