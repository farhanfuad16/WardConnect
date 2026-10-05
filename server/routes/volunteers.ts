import type { Express, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { volunteers, users, wards } from "../../drizzle/schema";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { AppError } from "../middleware/errorHandler";
import { notifyUser } from "../services/notify";
import { defaultVolunteers } from "../fallbackData";

// ── Validation ──────────────────────────────────────────────────────

const createVolunteerSchema = z.object({
  skillsOrInterest: z.string().optional(),
  // Lets a citizen volunteer for the ward an incident is actually in, which
  // may differ from their own home ward — without this, "I can help" on an
  // incident always registered against the user's own ward and could never
  // move that incident's displayed helper count.
  wardId: z.number().int().positive().optional(),
});

const updateVolunteerSchema = z.object({
  status: z.enum(["pending", "approved", "active", "inactive"]).optional(),
  skillsOrInterest: z.string().optional(),
});

// ── Routes ──────────────────────────────────────────────────────────

export function registerVolunteerRoutes(app: Express) {
  // GET /api/volunteers/count — count of admin-approved (approved/active) volunteers in a ward
  // Any authenticated user can call this (e.g. to show "N volunteers already
  // helping" on an incident); it only ever returns a number, never the
  // underlying volunteer records, since those are otherwise ward-admin-only.
  app.get("/api/volunteers/count", requireAuth, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) {
        const wardId = Number(req.query.wardId);
        if (!wardId) {
          res.status(400).json({ error: "wardId is required" });
          return;
        }
        const count = defaultVolunteers.filter((volunteer) => volunteer.wardId === wardId && ["approved", "active"].includes(volunteer.status)).length;
        res.json({ count });
        return;
      }

      const wardId = Number(req.query.wardId);
      if (!wardId) {
        res.status(400).json({ error: "wardId is required" });
        return;
      }

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(volunteers)
        .where(
          and(
            eq(volunteers.wardId, wardId),
            // Only volunteers an admin has approved count as "already helping".
            // "pending" signups are excluded until an admin accepts them, and
            // "inactive" (cancelled/rejected) never counts.
            sql`${volunteers.status} IN ('approved', 'active')`,
          ),
        );

      res.json({ count: Number(count) });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Volunteers] Count failed:", err);
      res.status(500).json({ error: "Failed to fetch volunteer count" });
    }
  });

  // GET /api/volunteers — list volunteers
  // Admin: sees all; regular user: sees only own
  app.get("/api/volunteers", requireAuth, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) {
        const user = req.dbUser!;
        const { wardId, status, limit: limitStr, offset: offsetStr } = req.query;
        const limit = Math.min(parseInt(limitStr as string) || 20, 100);
        const offset = parseInt(offsetStr as string) || 0;
        const items = defaultVolunteers.filter((volunteer) => {
          if (!user.isAdmin && volunteer.userId !== user.id) return false;
          if (user.isAdmin && wardId && volunteer.wardId !== Number(wardId)) return false;
          if (status && volunteer.status !== String(status)) return false;
          return true;
        });
        const page = items.slice(offset, offset + limit);
        res.json({ volunteers: page, total: items.length, limit, offset });
        return;
      }

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
      if (!db) {
        const user = req.dbUser!;
        const { wardId: requestedWardId, ...volunteerData } = parsed.data;
        const wardId = requestedWardId ?? user.wardId;
        if (!wardId) {
          res.status(400).json({ error: "You must be assigned to a ward to volunteer" });
          return;
        }
        const existing = defaultVolunteers.some((entry) => entry.userId === user.id && entry.wardId === wardId);
        if (existing) {
          res.status(409).json({ error: "You have already signed up as a volunteer for this ward" });
          return;
        }
        const volunteerId = defaultVolunteers.reduce((max, item) => Math.max(max, item.id), 0) + 1;
        const response = {
          id: volunteerId,
          userId: user.id,
          wardId,
          skillsOrInterest: volunteerData.skillsOrInterest ?? "",
          status: "pending",
        };
        defaultVolunteers.push({
          ...response,
          createdAt: new Date().toISOString(),
          userName: user.name || "Volunteer",
          wardName: "Ward " + wardId,
        });
        res.status(201).json({ volunteer: response });
        return;
      }

      const user = req.dbUser!;
      const { wardId: requestedWardId, ...volunteerData } = parsed.data;
      const wardId = requestedWardId ?? user.wardId;
      if (!wardId) {
        res.status(400).json({ error: "You must be assigned to a ward to volunteer" });
        return;
      }

      if (requestedWardId) {
        const ward = await db.select().from(wards).where(eq(wards.id, requestedWardId)).limit(1);
        if (ward.length === 0) {
          res.status(400).json({ error: "Ward not found" });
          return;
        }
      }

      // Check if user already has a pending/active volunteer record
      const existing = await db
        .select()
        .from(volunteers)
        .where(
          and(
            eq(volunteers.userId, user.id),
            eq(volunteers.wardId, wardId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        res.status(409).json({ error: "You have already signed up as a volunteer for this ward" });
        return;
      }

      const result = await db.insert(volunteers).values({
        userId: user.id,
        wardId,
        ...volunteerData,
      });

      const volunteerId = Number(result[0].insertId);

      res.status(201).json({
        volunteer: {
          id: volunteerId,
          userId: user.id,
          wardId,
          ...volunteerData,
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

      if (parsed.data.status) {
        notifyUser(
          db,
          existing[0].userId,
          "Your volunteer status changed",
          `Your volunteer offer is now ${parsed.data.status}.`,
        );
      }

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
