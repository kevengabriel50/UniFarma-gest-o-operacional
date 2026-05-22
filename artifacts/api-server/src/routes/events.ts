import { Router } from "express";
import { db, eventsTable, insertEventSchema, updateEventSchema } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { ListEventsQueryParams, CreateEventBody, UpdateEventBody, GetEventParams, UpdateEventParams, DeleteEventParams } from "@workspace/api-zod";

const router = Router();

router.get("/events/summary", async (req, res) => {
  try {
    const rows = await db
      .select({
        category: eventsTable.category,
        count: sql<number>`count(*)::int`,
      })
      .from(eventsTable)
      .groupBy(eventsTable.category);

    const byCategory = {
      ferias: 0,
      folga: 0,
      afastamento: 0,
      troca_plantao: 0,
      treinamento: 0,
    };

    let total = 0;
    for (const row of rows) {
      byCategory[row.category] = row.count;
      total += row.count;
    }

    res.json({ total, byCategory });
  } catch (err) {
    req.log.error({ err }, "Failed to get events summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/events", async (req, res) => {
  try {
    const parsed = ListEventsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};

    const conditions = [];

    if (params.start) {
      conditions.push(gte(eventsTable.start, params.start));
    }
    if (params.end) {
      conditions.push(lte(eventsTable.start, params.end));
    }
    if (params.category) {
      conditions.push(eq(eventsTable.category, params.category as typeof eventsTable.category._.data));
    }

    const events = await db
      .select()
      .from(eventsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(eventsTable.start);

    res.json(
      events.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list events");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/events", async (req, res) => {
  try {
    const parsed = CreateEventBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }

    const data = insertEventSchema.parse(parsed.data);
    const [event] = await db.insert(eventsTable).values(data).returning();

    res.status(201).json({ ...event, createdAt: event.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to create event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/events/:id", async (req, res) => {
  try {
    const parsed = GetEventParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, parsed.data.id));
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    res.json({ ...event, createdAt: event.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/events/:id", async (req, res) => {
  try {
    const paramsParsed = UpdateEventParams.safeParse({ id: Number(req.params.id) });
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const bodyParsed = UpdateEventBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "Invalid request body", details: bodyParsed.error.issues });
      return;
    }

    const data = updateEventSchema.parse(bodyParsed.data);
    const [event] = await db
      .update(eventsTable)
      .set(data)
      .where(eq(eventsTable.id, paramsParsed.data.id))
      .returning();

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    res.json({ ...event, createdAt: event.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to update event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/events/:id", async (req, res) => {
  try {
    const parsed = DeleteEventParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [deleted] = await db
      .delete(eventsTable)
      .where(eq(eventsTable.id, parsed.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete event");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
