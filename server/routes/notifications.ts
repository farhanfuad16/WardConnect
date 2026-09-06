import type { Express, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { notifications } from "../../drizzle/schema";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

// ── Validation ──────────────────────────────────────────────────────

const createNotificationSchema = z.object({
  userId: z.number().int().positive("User ID is required"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

// ── Routes ──────────────────────────────────────────────────────────

export function registerNotificationRoutes(app: Express) {
  // GET /api/notifications — list current user's notifications
  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      const { unreadOnly, limit: limitStr, offset: offsetStr } = req.query;
      const limit = Math.min(parseInt(limitStr as string) || 20, 100);
      const offset = parseInt(offsetStr as string) || 0;

      const conditions = [eq(notifications.userId, user.id)];
      if (unreadOnly === "true") {
        conditions.push(eq(notifications.isRead, false));
      }

      const where = and(...conditions);

      const rows = await db
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(where);

      const [{ count: unreadCount }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

      res.json({ notifications: rows, total: count, unreadCount, limit, offset });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Notifications] List failed:", err);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // POST /api/notifications — create notification (authenticated, for system use)
  app.post("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = createNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const result = await db.insert(notifications).values(parsed.data);
      const notificationId = Number(result[0].insertId);

      res.status(201).json({
        notification: { id: notificationId, ...parsed.data, isRead: false },
      });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Notifications] Create failed:", err);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // PATCH /api/notifications/:id/read — mark as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      const notificationId = Number(req.params.id);

      const existing = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)))
        .limit(1);

      if (existing.length === 0) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));

      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Notifications] Mark read failed:", err);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // PATCH /api/notifications/read-all — mark all as read
  app.patch("/api/notifications/read-all", requireAuth, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Notifications] Read all failed:", err);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // DELETE /api/notifications/:id
  app.delete("/api/notifications/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const user = req.dbUser!;
      const notificationId = Number(req.params.id);

      const existing = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)))
        .limit(1);

      if (existing.length === 0) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }

      await db.delete(notifications).where(eq(notifications.id, notificationId));
      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Notifications] Delete failed:", err);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });
}
