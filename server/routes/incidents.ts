import type { Express, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { incidents, wards } from "../../drizzle/schema";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { AppError } from "../middleware/errorHandler";

// ── Validation ──────────────────────────────────────────────────────

const createIncidentSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  severity: z.enum(["High", "Medium", "Low"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.string().min(1, "Status is required"),
  accent: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

const updateIncidentSchema = z.object({
  title: z.string().min(2).optional(),
  category: z.string().min(1).optional(),
  severity: z.enum(["High", "Medium", "Low"]).optional(),
  description: z.string().min(10).optional(),
  status: z.string().min(1).optional(),
  accent: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

// ── Routes ──────────────────────────────────────────────────────────

export function registerIncidentRoutes(app: Express) {
  // GET /api/incidents — public read
  app.get("/api/incidents", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const { wardId, severity, limit: limitStr, offset: offsetStr } = req.query;
      const limit = Math.min(parseInt(limitStr as string) || 20, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const conditions = [];
      if (wardId) conditions.push(eq(incidents.wardId, Number(wardId)));
      if (severity) conditions.push(eq(incidents.severity, severity as any));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          id: incidents.id,
          wardId: incidents.wardId,
          title: incidents.title,
          category: incidents.category,
          severity: incidents.severity,
          description: incidents.description,
          status: incidents.status,
          accent: incidents.accent,
          latitude: incidents.latitude,
          longitude: incidents.longitude,
          verifiedBy: incidents.verifiedBy,
          createdAt: incidents.createdAt,
          wardName: wards.name,
        })
        .from(incidents)
        .leftJoin(wards, eq(incidents.wardId, wards.id))
        .where(where)
        .orderBy(desc(incidents.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(incidents)
        .where(where);

      res.json({ incidents: rows, total: count, limit, offset });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Incidents] List failed:", err);
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  // GET /api/incidents/:id
  app.get("/api/incidents/:id", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const rows = await db
        .select({
          id: incidents.id,
          wardId: incidents.wardId,
          title: incidents.title,
          category: incidents.category,
          severity: incidents.severity,
          description: incidents.description,
          status: incidents.status,
          accent: incidents.accent,
          latitude: incidents.latitude,
          longitude: incidents.longitude,
          verifiedBy: incidents.verifiedBy,
          createdAt: incidents.createdAt,
          wardName: wards.name,
        })
        .from(incidents)
        .leftJoin(wards, eq(incidents.wardId, wards.id))
        .where(eq(incidents.id, Number(req.params.id)))
        .limit(1);

      if (rows.length === 0) {
        res.status(404).json({ error: "Incident not found" });
        return;
      }

      res.json({ incident: rows[0] });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Incidents] Get failed:", err);
      res.status(500).json({ error: "Failed to fetch incident" });
    }
  });

  // POST /api/incidents — admin only
  app.post("/api/incidents", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = createIncidentSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      const wardId = user.wardId ?? 1;

      const result = await db.insert(incidents).values({
        wardId,
        verifiedBy: user.id,
        ...parsed.data,
        latitude: parsed.data.latitude != null ? String(parsed.data.latitude) : undefined,
        longitude: parsed.data.longitude != null ? String(parsed.data.longitude) : undefined,
      });

      const incidentId = Number(result[0].insertId);

      res.status(201).json({
        incident: { id: incidentId, wardId, verifiedBy: user.id, ...parsed.data },
      });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Incidents] Create failed:", err);
      res.status(500).json({ error: "Failed to create incident" });
    }
  });

  // PATCH /api/incidents/:id — admin only
  app.patch("/api/incidents/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = updateIncidentSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const incidentId = Number(req.params.id);
      const existing = await db.select().from(incidents).where(eq(incidents.id, incidentId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "Incident not found" });
        return;
      }

      const updateData: Record<string, unknown> = { ...parsed.data };
      if (updateData.latitude != null) updateData.latitude = String(updateData.latitude);
      if (updateData.longitude != null) updateData.longitude = String(updateData.longitude);

      await db.update(incidents).set(updateData).where(eq(incidents.id, incidentId));
      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Incidents] Update failed:", err);
      res.status(500).json({ error: "Failed to update incident" });
    }
  });

  // DELETE /api/incidents/:id — admin only
  app.delete("/api/incidents/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const incidentId = Number(req.params.id);
      const existing = await db.select().from(incidents).where(eq(incidents.id, incidentId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "Incident not found" });
        return;
      }

      await db.delete(incidents).where(eq(incidents.id, incidentId));
      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Incidents] Delete failed:", err);
      res.status(500).json({ error: "Failed to delete incident" });
    }
  });
}
