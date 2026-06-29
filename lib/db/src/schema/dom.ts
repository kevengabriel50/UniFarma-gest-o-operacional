import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const domStatusEnum = pgEnum("dom_status", ["em_andamento", "finalizado"]);

export const domAtendimentosTable = pgTable("dom_atendimentos", {
  id: serial("id").primaryKey(),
  nomePaciente: text("nome_paciente").notNull(),
  numeroAtendimento: text("numero_atendimento").notNull(),
  data: text("data").notNull(),
  observacoes: text("observacoes"),
  status: domStatusEnum("status").notNull().default("em_andamento"),
  usuarioNome: text("usuario_nome"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const domItensTable = pgTable("dom_itens", {
  id: serial("id").primaryKey(),
  atendimentoId: integer("atendimento_id").notNull().references(() => domAtendimentosTable.id),
  codigoBarras: text("codigo_barras").notNull(),
  codigoInterno: text("codigo_interno").notNull(),
  nome: text("nome").notNull(),
  lote: text("lote").notNull(),
  quantidade: integer("quantidade").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDomAtendimentoSchema = createInsertSchema(domAtendimentosTable).omit({
  id: true,
  createdAt: true,
});
export const updateDomAtendimentoSchema = insertDomAtendimentoSchema.partial();

export const insertDomItemSchema = createInsertSchema(domItensTable).omit({
  id: true,
  createdAt: true,
});
export const updateDomItemSchema = insertDomItemSchema.partial();

export type InsertDomAtendimento = z.infer<typeof insertDomAtendimentoSchema>;
export type UpdateDomAtendimento = z.infer<typeof updateDomAtendimentoSchema>;
export type DomAtendimento = typeof domAtendimentosTable.$inferSelect;

export type InsertDomItem = z.infer<typeof insertDomItemSchema>;
export type UpdateDomItem = z.infer<typeof updateDomItemSchema>;
export type DomItem = typeof domItensTable.$inferSelect;
