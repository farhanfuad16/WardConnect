import type { Express, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { sosAlerts, users, wards } from "../../drizzle/schema";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

// ── Validation ──────────────────────────────────────────────────────

const createSosSchema = z.object({
  type: z.string().min(1, "SOS type is required"),
  note: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

const updateSosSchema = z.object({
  status: z.enum(["pending", "dispatched", "resolved", "cancelled"]).optional(),
});

// ── Routes ──────────────────────────────────────────────────────────

export function registerSosAlertRoutes(app: Express) {
  // GET /api/sos — list SOS alerts
  app.get("/api/sos", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const { wardId, status, limit: limitStr, offset: offsetStr } = req.query;
      const limit = Math.min(parseInt(limitStr as string) || 20, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const conditions = [];
      if (wardId) conditions.push(eq(sosAlerts.wardId, Number(wardId)));
      if (status) conditions.push(eq(sosAlerts.status, status as any));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          id: sosAlerts.id,
          userId: sosAlerts.userId,
          wardId: sosAlerts.wardId,
          type: sosAlerts.type,
          status: sosAlerts.status,
          note: sosAlerts.note,
          latitude: sosAlerts.latitude,
          longitude: sosAlerts.longitude,
          createdAt: sosAlerts.createdAt,
          userName: users.name,
          wardName: wards.name,
        })
        .from(sosAlerts)
        .leftJoin(users, eq(sosAlerts.userId, users.id))
        .leftJoin(wards, eq(sosAlerts.wardId, wards.id))
        .where(where)
        .orderBy(desc(sosAlerts.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sosAlerts)
        .where(where);

      res.json({ alerts: rows, total: count, limit, offset });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[SOS] List failed:", err);
      res.status(500).json({ error: "Failed to fetch SOS alerts" });
    }
  });

  // GET /api/sos/:id
  app.get("/api/sos/:id", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const rows = await db
        .select({
          id: sosAlerts.id,
          userId: sosAlerts.userId,
          wardId: sosAlerts.wardId,
          type: sosAlerts.type,
          status: sosAlerts.status,
          note: sosAlerts.note,
          latitude: sosAlerts.latitude,
          longitude: sosAlerts.longitude,
          createdAt: sosAlerts.createdAt,
          userName: users.name,
          wardName: wards.name,
        })
        .from(sosAlerts)
        .leftJoin(users, eq(sosAlerts.userId, users.id))
        .leftJoin(wards, eq(sosAlerts.wardId, wards.id))
        .where(eq(sosAlerts.id, Number(req.params.id)))
        .limit(1);

      if (rows.length === 0) {
        res.status(404).json({ error: "SOS alert not found" });
        return;
      }

      res.json({ alert: rows[0] });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[SOS] Get failed:", err);
      res.status(500).json({ error: "Failed to fetch SOS alert" });
    }
  });

  // POST /api/sos — create SOS alert (authenticated)
  app.post("/api/sos", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = createSosSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      if (!user.wardId) {
        res.status(400).json({ error: "You must be assigned to a ward to send SOS" });
        return;
      }

      const result = await db.insert(sosAlerts).values({
        userId: user.id,
        wardId: user.wardId,
        ...parsed.data,
        latitude: parsed.data.latitude != null ? String(parsed.data.latitude) : undefined,
        longitude: parsed.data.longitude != null ? String(parsed.data.longitude) : undefined,
      });

      const alertId = Number(result[0].insertId);

      res.status(201).json({
        alert: { id: alertId, userId: user.id, wardId: user.wardId, ...parsed.data, status: "pending" },
      });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[SOS] Create failed:", err);
      res.status(500).json({ error: "Failed to create SOS alert" });
    }
  });

  // PATCH /api/sos/:id — update SOS status (admin only)
  app.patch("/api/sos/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = updateSosSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      if (!user.isAdmin) {
        res.status(403).json({ error: "Only admins can update SOS status" });
        return;
      }

      const alertId = Number(req.params.id);
      const existing = await db.select().from(sosAlerts).where(eq(sosAlerts.id, alertId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "SOS alert not found" });
        return;
      }

      await db.update(sosAlerts).set(parsed.data).where(eq(sosAlerts.id, alertId));
      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[SOS] Update failed:", err);
      res.status(500).json({ error: "Failed to update SOS alert" });
    }
  });
}
