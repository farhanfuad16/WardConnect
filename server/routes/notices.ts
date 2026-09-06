import type { Express, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { notices, wards, users } from "../../drizzle/schema";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { AppError } from "../middleware/errorHandler";

// ── Validation ──────────────────────────────────────────────────────

const createNoticeSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  category: z.enum(["Emergency Alert", "Utility Notice", "General Notice"]).default("General Notice"),
});

const updateNoticeSchema = z.object({
  title: z.string().min(2).optional(),
  body: z.string().min(10).optional(),
  category: z.enum(["Emergency Alert", "Utility Notice", "General Notice"]).optional(),
});

// ── Routes ──────────────────────────────────────────────────────────

export function registerNoticeRoutes(app: Express) {
  // GET /api/notices — public read
  app.get("/api/notices", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const { wardId, category, limit: limitStr, offset: offsetStr } = req.query;
      const limit = Math.min(parseInt(limitStr as string) || 20, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const conditions = [];
      if (wardId) conditions.push(eq(notices.wardId, Number(wardId)));
      if (category) conditions.push(eq(notices.category, category as any));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          id: notices.id,
          wardId: notices.wardId,
          title: notices.title,
          body: notices.body,
          category: notices.category,
          postedBy: notices.postedBy,
          createdAt: notices.createdAt,
          wardName: wards.name,
          postedByName: users.name,
        })
        .from(notices)
        .leftJoin(wards, eq(notices.wardId, wards.id))
        .leftJoin(users, eq(notices.postedBy, users.id))
        .where(where)
        .orderBy(desc(notices.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notices)
        .where(where);

      res.json({ notices: rows, total: count, limit, offset });
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
        .select({
          id: notices.id,
          wardId: notices.wardId,
          title: notices.title,
          body: notices.body,
          category: notices.category,
          postedBy: notices.postedBy,
          createdAt: notices.createdAt,
          wardName: wards.name,
          postedByName: users.name,
        })
        .from(notices)
        .leftJoin(wards, eq(notices.wardId, wards.id))
        .leftJoin(users, eq(notices.postedBy, users.id))
        .where(eq(notices.id, Number(req.params.id)))
        .limit(1);

      if (rows.length === 0) {
        res.status(404).json({ error: "Notice not found" });
        return;
      }

      res.json({ notice: rows[0] });
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
      const wardId = user.wardId ?? 1;

      const result = await db.insert(notices).values({
        wardId,
        postedBy: user.id,
        ...parsed.data,
      });

      const noticeId = Number(result[0].insertId);

      res.status(201).json({
        notice: { id: noticeId, wardId, postedBy: user.id, ...parsed.data },
      });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Notices] Create failed:", err);
      res.status(500).json({ error: "Failed to create notice" });
    }
  });

  // PATCH /api/notices/:id — admin only
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

      await db.update(notices).set(parsed.data).where(eq(notices.id, noticeId));
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
