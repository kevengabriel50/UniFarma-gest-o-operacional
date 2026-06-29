import { pgTable, serial, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const taskPrioridadeEnum = pgEnum("task_prioridade", ["Alta", "Média", "Baixa"]);

export const tasksPlantaoTable = pgTable("tasks_plantao", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  prioridade: taskPrioridadeEnum("prioridade").notNull().default("Média"),
  concluida: boolean("concluida").notNull().default(false),
  concluidaEm: timestamp("concluida_em"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const registrosPlantaoTable = pgTable("registros_plantao", {
  id: serial("id").primaryKey(),
  farmaceutico: text("farmaceutico").notNull().default(""),
  turno: text("turno").notNull(),
  data: text("data").notNull(),
  statusLeitos: text("status_leitos").notNull().default(""),
  intercorrencias: text("intercorrencias").notNull().default(""),
  observacoes: text("observacoes").notNull().default(""),
  savedAt: timestamp("saved_at").notNull().defaultNow(),
});

export const insertTaskPlantaoSchema = createInsertSchema(tasksPlantaoTable).omit({
  id: true,
  createdAt: true,
});
export const updateTaskPlantaoSchema = insertTaskPlantaoSchema.partial();

export const insertRegistroPlantaoSchema = createInsertSchema(registrosPlantaoTable).omit({
  id: true,
  savedAt: true,
});

export type InsertTaskPlantao = z.infer<typeof insertTaskPlantaoSchema>;
export type UpdateTaskPlantao = z.infer<typeof updateTaskPlantaoSchema>;
export type TaskPlantao = typeof tasksPlantaoTable.$inferSelect;

export type InsertRegistroPlantao = z.infer<typeof insertRegistroPlantaoSchema>;
export type RegistroPlantao = typeof registrosPlantaoTable.$inferSelect;
