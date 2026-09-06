import type { Express, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { resources, wards } from "../../drizzle/schema";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { AppError } from "../middleware/errorHandler";

// ── Validation ──────────────────────────────────────────────────────

const createResourceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  contactInfo: z.string().min(1, "Contact info is required"),
  address: z.string().optional(),
});

const updateResourceSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().min(1).optional(),
  contactInfo: z.string().min(1).optional(),
  address: z.string().optional(),
});

// ── Routes ──────────────────────────────────────────────────────────

export function registerResourceRoutes(app: Express) {
  // GET /api/resources — public read
  app.get("/api/resources", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const { wardId, category, search, limit: limitStr, offset: offsetStr } = req.query;
      const limit = Math.min(parseInt(limitStr as string) || 20, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const conditions = [];
      if (wardId) conditions.push(eq(resources.wardId, Number(wardId)));
      if (category) conditions.push(eq(resources.category, category as string));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          id: resources.id,
          wardId: resources.wardId,
          name: resources.name,
          category: resources.category,
          contactInfo: resources.contactInfo,
          address: resources.address,
          createdAt: resources.createdAt,
          wardName: wards.name,
        })
        .from(resources)
        .leftJoin(wards, eq(resources.wardId, wards.id))
        .where(where)
        .orderBy(desc(resources.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(resources)
        .where(where);

      res.json({ resources: rows, total: count, limit, offset });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Resources] List failed:", err);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  // GET /api/resources/:id
  app.get("/api/resources/:id", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const rows = await db
        .select({
          id: resources.id,
          wardId: resources.wardId,
          name: resources.name,
          category: resources.category,
          contactInfo: resources.contactInfo,
          address: resources.address,
          createdAt: resources.createdAt,
          wardName: wards.name,
        })
        .from(resources)
        .leftJoin(wards, eq(resources.wardId, wards.id))
        .where(eq(resources.id, Number(req.params.id)))
        .limit(1);

      if (rows.length === 0) {
        res.status(404).json({ error: "Resource not found" });
        return;
      }

      res.json({ resource: rows[0] });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Resources] Get failed:", err);
      res.status(500).json({ error: "Failed to fetch resource" });
    }
  });

  // POST /api/resources — admin only
  app.post("/api/resources", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = createResourceSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      const wardId = user.wardId ?? 1;

      const result = await db.insert(resources).values({
        wardId,
        ...parsed.data,
      });

      const resourceId = Number(result[0].insertId);

      res.status(201).json({
        resource: { id: resourceId, wardId, ...parsed.data },
      });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Resources] Create failed:", err);
      res.status(500).json({ error: "Failed to create resource" });
    }
  });

  // PATCH /api/resources/:id — admin only
  app.patch("/api/resources/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = updateResourceSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const resourceId = Number(req.params.id);
      const existing = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "Resource not found" });
        return;
      }

      await db.update(resources).set(parsed.data).where(eq(resources.id, resourceId));
      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Resources] Update failed:", err);
      res.status(500).json({ error: "Failed to update resource" });
    }
  });

  // DELETE /api/resources/:id — admin only
  app.delete("/api/resources/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const resourceId = Number(req.params.id);
      const existing = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "Resource not found" });
        return;
      }

      await db.delete(resources).where(eq(resources.id, resourceId));
      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Resources] Delete failed:", err);
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });
}
