import type { Express, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { volunteers, users, wards } from "../../drizzle/schema";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { AppError } from "../middleware/errorHandler";

// ── Validation ──────────────────────────────────────────────────────

const createVolunteerSchema = z.object({
  skillsOrInterest: z.string().optional(),
});

const updateVolunteerSchema = z.object({
  status: z.enum(["pending", "approved", "active", "inactive"]).optional(),
  skillsOrInterest: z.string().optional(),
});

// ── Routes ──────────────────────────────────────────────────────────

export function registerVolunteerRoutes(app: Express) {
  // GET /api/volunteers — list volunteers
  // Admin: sees all; regular user: sees only own
  app.get("/api/volunteers", requireAuth, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      const { wardId, status, limit: limitStr, offset: offsetStr } = req.query;
      const limit = Math.min(parseInt(limitStr as string) || 20, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const conditions = [];
      if (!user.isAdmin) {
        conditions.push(eq(volunteers.userId, user.id));
      } else if (wardId) {
        conditions.push(eq(volunteers.wardId, Number(wardId)));
      }
      if (status) conditions.push(eq(volunteers.status, status as any));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          id: volunteers.id,
          userId: volunteers.userId,
          wardId: volunteers.wardId,
          skillsOrInterest: volunteers.skillsOrInterest,
          status: volunteers.status,
          createdAt: volunteers.createdAt,
          userName: users.name,
          wardName: wards.name,
        })
        .from(volunteers)
        .leftJoin(users, eq(volunteers.userId, users.id))
        .leftJoin(wards, eq(volunteers.wardId, wards.id))
        .where(where)
        .orderBy(desc(volunteers.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(volunteers)
        .where(where);

      res.json({ volunteers: rows, total: count, limit, offset });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Volunteers] List failed:", err);
      res.status(500).json({ error: "Failed to fetch volunteers" });
    }
  });

  // POST /api/volunteers — submit volunteer interest (authenticated)
  app.post("/api/volunteers", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = createVolunteerSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      if (!user.wardId) {
        res.status(400).json({ error: "You must be assigned to a ward to volunteer" });
        return;
      }

      // Check if user already has a pending/active volunteer record
      const existing = await db
        .select()
        .from(volunteers)
        .where(
          and(
            eq(volunteers.userId, user.id),
            eq(volunteers.wardId, user.wardId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        res.status(409).json({ error: "You have already signed up as a volunteer for this ward" });
        return;
      }

      const result = await db.insert(volunteers).values({
        userId: user.id,
        wardId: user.wardId,
        ...parsed.data,
      });

      const volunteerId = Number(result[0].insertId);

      res.status(201).json({
        volunteer: {
          id: volunteerId,
          userId: user.id,
          wardId: user.wardId,
          ...parsed.data,
          status: "pending",
        },
      });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Volunteers] Create failed:", err);
      res.status(500).json({ error: "Failed to submit volunteer interest" });
    }
  });

  // PATCH /api/volunteers/:id — update volunteer (admin only)
  app.patch("/api/volunteers/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = updateVolunteerSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const volunteerId = Number(req.params.id);
      const existing = await db.select().from(volunteers).where(eq(volunteers.id, volunteerId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "Volunteer not found" });
        return;
      }

      await db.update(volunteers).set(parsed.data).where(eq(volunteers.id, volunteerId));
      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Volunteers] Update failed:", err);
      res.status(500).json({ error: "Failed to update volunteer" });
    }
  });

  // DELETE /api/volunteers/:id — remove volunteer (admin or self)
  app.delete("/api/volunteers/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      const volunteerId = Number(req.params.id);

      const existing = await db.select().from(volunteers).where(eq(volunteers.id, volunteerId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "Volunteer not found" });
        return;
      }

      // Only admin or the volunteer themselves can delete
      if (!user.isAdmin && existing[0].userId !== user.id) {
        res.status(403).json({ error: "Not authorized to remove this volunteer" });
        return;
      }

      await db.delete(volunteers).where(eq(volunteers.id, volunteerId));
      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Volunteers] Delete failed:", err);
      res.status(500).json({ error: "Failed to remove volunteer" });
    }
  });
}
