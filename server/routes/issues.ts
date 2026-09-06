import type { Express, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { issues, users, wards } from "../../drizzle/schema";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

// ── Validation ──────────────────────────────────────────────────────

const createIssueSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  severity: z.enum(["normal", "emergency"]).default("normal"),
  landmark: z.string().optional(),
  photoUrl: z.string().url().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

const updateIssueSchema = z.object({
  status: z.enum(["submitted", "acknowledged", "in_progress", "resolved", "rejected"]).optional(),
  category: z.string().min(1).optional(),
  title: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  severity: z.enum(["normal", "emergency"]).optional(),
  landmark: z.string().optional(),
  photoUrl: z.string().url().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

// ── Routes ──────────────────────────────────────────────────────────

export function registerIssueRoutes(app: Express) {
  // GET /api/issues — list issues (public, filterable)
  app.get("/api/issues", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const { wardId, status, limit: limitStr, offset: offsetStr } = req.query;
      const limit = Math.min(parseInt(limitStr as string) || 20, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const conditions = [];
      if (wardId) conditions.push(eq(issues.wardId, Number(wardId)));
      if (status) conditions.push(eq(issues.status, status as any));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          id: issues.id,
          userId: issues.userId,
          wardId: issues.wardId,
          category: issues.category,
          title: issues.title,
          description: issues.description,
          status: issues.status,
          severity: issues.severity,
          landmark: issues.landmark,
          photoUrl: issues.photoUrl,
          latitude: issues.latitude,
          longitude: issues.longitude,
          createdAt: issues.createdAt,
          updatedAt: issues.updatedAt,
          userName: users.name,
          wardName: wards.name,
        })
        .from(issues)
        .leftJoin(users, eq(issues.userId, users.id))
        .leftJoin(wards, eq(issues.wardId, wards.id))
        .where(where)
        .orderBy(desc(issues.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(issues)
        .where(where);

      res.json({ issues: rows, total: count, limit, offset });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Issues] List failed:", err);
      res.status(500).json({ error: "Failed to fetch issues" });
    }
  });

  // GET /api/issues/:id — get single issue
  app.get("/api/issues/:id", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const rows = await db
        .select({
          id: issues.id,
          userId: issues.userId,
          wardId: issues.wardId,
          category: issues.category,
          title: issues.title,
          description: issues.description,
          status: issues.status,
          severity: issues.severity,
          landmark: issues.landmark,
          photoUrl: issues.photoUrl,
          latitude: issues.latitude,
          longitude: issues.longitude,
          createdAt: issues.createdAt,
          updatedAt: issues.updatedAt,
          userName: users.name,
          wardName: wards.name,
        })
        .from(issues)
        .leftJoin(users, eq(issues.userId, users.id))
        .leftJoin(wards, eq(issues.wardId, wards.id))
        .where(eq(issues.id, Number(req.params.id)))
        .limit(1);

      if (rows.length === 0) {
        res.status(404).json({ error: "Issue not found" });
        return;
      }

      res.json({ issue: rows[0] });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Issues] Get failed:", err);
      res.status(500).json({ error: "Failed to fetch issue" });
    }
  });

  // POST /api/issues — create issue (authenticated)
  app.post("/api/issues", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = createIssueSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      const wardId = user.wardId;
      if (!wardId) {
        res.status(400).json({ error: "You must be assigned to a ward to create issues" });
        return;
      }

      const result = await db.insert(issues).values({
        userId: user.id,
        wardId,
        ...parsed.data,
        latitude: parsed.data.latitude != null ? String(parsed.data.latitude) : undefined,
        longitude: parsed.data.longitude != null ? String(parsed.data.longitude) : undefined,
      });

      const issueId = Number(result[0].insertId);

      res.status(201).json({
        issue: { id: issueId, userId: user.id, wardId, ...parsed.data, status: "submitted" },
      });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Issues] Create failed:", err);
      res.status(500).json({ error: "Failed to create issue" });
    }
  });

  // PATCH /api/issues/:id — update issue (owner or admin)
  app.patch("/api/issues/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = updateIssueSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      const issueId = Number(req.params.id);

      // Check issue exists
      const existing = await db.select().from(issues).where(eq(issues.id, issueId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "Issue not found" });
        return;
      }

      // Only owner or admin can update
      if (existing[0].userId !== user.id && !user.isAdmin) {
        res.status(403).json({ error: "Not authorized to update this issue" });
        return;
      }

      // Only admin can change status
      const updateData: Record<string, unknown> = { ...parsed.data };
      if (updateData.status && !user.isAdmin) {
        delete updateData.status;
      }
      if (updateData.latitude != null) updateData.latitude = String(updateData.latitude);
      if (updateData.longitude != null) updateData.longitude = String(updateData.longitude);

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ error: "No valid fields to update" });
        return;
      }

      await db.update(issues).set(updateData).where(eq(issues.id, issueId));

      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Issues] Update failed:", err);
      res.status(500).json({ error: "Failed to update issue" });
    }
  });
}
