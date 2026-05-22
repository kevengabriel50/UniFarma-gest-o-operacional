import { pgTable, serial, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventCategoryEnum = pgEnum("event_category", [
  "ferias",
  "folga",
  "afastamento",
  "troca_plantao",
  "treinamento",
]);

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: eventCategoryEnum("category").notNull(),
  description: text("description"),
  employeeName: text("employee_name"),
  start: text("start").notNull(),
  end: text("end"),
  allDay: boolean("all_day").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export const updateEventSchema = insertEventSchema.partial();

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type CalendarEvent = typeof eventsTable.$inferSelect;
