import type { Express, Request, Response } from "express";
import { eq, and, desc, sql, or, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { notices, noticeWards, wards, users } from "../../drizzle/schema";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { AppError } from "../middleware/errorHandler";
import { notifyResidents } from "../services/notify";

// ── Validation ──────────────────────────────────────────────────────

// Who a notice is for: every ward, or a list of wards. The admin chooses this;
// it is no longer the admin's own ward (admins aren't residents of a ward).
const targetFields = {
  allWards: z.boolean().optional(),
  wardIds: z.array(z.number().int().positive()).max(100).optional(),
};

const createNoticeSchema = z
  .object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    body: z.string().min(10, "Body must be at least 10 characters"),
    category: z.enum(["Emergency Alert", "Utility Notice", "General Notice"]).default("General Notice"),
    ...targetFields,
  })
  .refine((d) => d.allWards || (d.wardIds?.length ?? 0) > 0, { message: "Choose at least one ward, or all wards" });

const updateNoticeSchema = z
  .object({
    title: z.string().min(2).optional(),
    body: z.string().min(10).optional(),
    category: z.enum(["Emergency Alert", "Utility Notice", "General Notice"]).optional(),
    ...targetFields,
  })
  .refine((d) => d.allWards !== false || (d.wardIds?.length ?? 0) > 0, { message: "Choose at least one ward, or all wards" });

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const noticeColumns = {
  id: notices.id,
  title: notices.title,
  body: notices.body,
  category: notices.category,
  allWards: notices.allWards,
  postedBy: notices.postedBy,
  createdAt: notices.createdAt,
  postedByName: users.name,
};

/** Adds `wards: [{ id, name }]` (the targets) to each notice. */
async function withTargets<T extends { id: number }>(db: Db, rows: T[]): Promise<(T & { wards: { id: number; name: string }[] })[]> {
  if (rows.length === 0) return [];
  const targets = await db
    .select({ noticeId: noticeWards.noticeId, id: wards.id, name: wards.name })
    .from(noticeWards)
    .innerJoin(wards, eq(noticeWards.wardId, wards.id))
    .where(inArray(noticeWards.noticeId, rows.map((r) => r.id)))
    .orderBy(wards.id);
  return rows.map((r) => ({ ...r, wards: targets.filter((t) => t.noticeId === r.id).map(({ id, name }) => ({ id, name })) }));
}

/** Throws a 400 unless every id is a real ward. */
async function checkWards(db: Db, wardIds: number[]): Promise<number[]> {
  const unique = [...new Set(wardIds)];
  if (unique.length === 0) return unique;
  const found = await db.select({ id: wards.id }).from(wards).where(inArray(wards.id, unique));
  if (found.length !== unique.length) throw new AppError(400, "One or more wards don't exist");
  return unique;
}

// ── Routes ──────────────────────────────────────────────────────────

export function registerNoticeRoutes(app: Express) {
  // GET /api/notices — public read. ?wardId=N returns what a resident of ward N
  // sees: notices for all wards plus those sent to ward N.
  app.get("/api/notices", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const { wardId, category, limit: limitStr, offset: offsetStr } = req.query;
      const limit = Math.min(parseInt(limitStr as string) || 20, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const conditions = [];
      if (wardId) {
        conditions.push(
          or(
            eq(notices.allWards, true),
            inArray(notices.id, db.select({ id: noticeWards.noticeId }).from(noticeWards).where(eq(noticeWards.wardId, Number(wardId)))),
          ),
        );
      }
      if (category) conditions.push(eq(notices.category, category as any));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select(noticeColumns)
        .from(notices)
        .leftJoin(users, eq(notices.postedBy, users.id))
        .where(where)
        .orderBy(desc(notices.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notices)
        .where(where);

      res.json({ notices: await withTargets(db, rows), total: count, limit, offset });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Notices] List failed:", err);
      res.status(500).json({ error: "Failed to fetch notices" });
    }
  });

  // GET /api/notices/:id
  app.get("/api/notices/:id", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const rows = await db
        .select(noticeColumns)
        .from(notices)
        .leftJoin(users, eq(notices.postedBy, users.id))
        .where(eq(notices.id, Number(req.params.id)))
        .limit(1);

      if (rows.length === 0) {
        res.status(404).json({ error: "Notice not found" });
        return;
      }

      res.json({ notice: (await withTargets(db, rows))[0] });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Notices] Get failed:", err);
      res.status(500).json({ error: "Failed to fetch notice" });
    }
  });

  // POST /api/notices — admin only
  app.post("/api/notices", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = createNoticeSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      const { allWards = false, wardIds = [], ...fields } = parsed.data;
      const targets = allWards ? [] : await checkWards(db, wardIds);

      const result = await db.insert(notices).values({ allWards, postedBy: user.id, ...fields });
      const noticeId = Number(result[0].insertId);
      if (targets.length > 0) {
        await db.insert(noticeWards).values(targets.map((wardId) => ({ noticeId, wardId })));
      }

      // Fire-and-forget: the notice was already saved successfully.
      notifyResidents(db, allWards ? "all" : targets, `New notice: ${fields.title}`, fields.body);

      res.status(201).json({ notice: { id: noticeId, allWards, wardIds: targets, postedBy: user.id, ...fields } });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Notices] Create failed:", err);
      res.status(500).json({ error: "Failed to create notice" });
    }
  });

  // PATCH /api/notices/:id — admin only. Sending allWards/wardIds replaces the targets.
  app.patch("/api/notices/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = updateNoticeSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const noticeId = Number(req.params.id);
      const existing = await db.select().from(notices).where(eq(notices.id, noticeId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "Notice not found" });
        return;
      }

      const { allWards, wardIds, ...fields } = parsed.data;
      const retarget = allWards !== undefined || wardIds !== undefined;
      const targets = retarget && !allWards ? await checkWards(db, wardIds ?? []) : [];
      if (retarget && !allWards && targets.length === 0) {
        res.status(400).json({ error: "Choose at least one ward, or all wards" });
        return;
      }

      const updateData: Record<string, unknown> = { ...fields };
      if (retarget) updateData.allWards = !!allWards;
      if (Object.keys(updateData).length > 0) {
        await db.update(notices).set(updateData).where(eq(notices.id, noticeId));
      }
      if (retarget) {
        await db.delete(noticeWards).where(eq(noticeWards.noticeId, noticeId));
        if (targets.length > 0) await db.insert(noticeWards).values(targets.map((wardId) => ({ noticeId, wardId })));
      }
      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Notices] Update failed:", err);
      res.status(500).json({ error: "Failed to update notice" });
    }
  });

  // DELETE /api/notices/:id — admin only
  app.delete("/api/notices/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const noticeId = Number(req.params.id);
      const existing = await db.select().from(notices).where(eq(notices.id, noticeId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "Notice not found" });
        return;
      }

      await db.delete(noticeWards).where(eq(noticeWards.noticeId, noticeId));
      await db.delete(notices).where(eq(notices.id, noticeId));
      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Notices] Delete failed:", err);
      res.status(500).json({ error: "Failed to delete notice" });
    }
  });
}
