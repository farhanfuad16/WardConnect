import type { Express, Request, Response } from "express";
import { desc, eq, like, or, sql } from "drizzle-orm";
import { getDb } from "../db";
import { incidentVolunteers, users, wards } from "../../drizzle/schema";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { AppError } from "../middleware/errorHandler";

export function registerUserRoutes(app: Express) {
  // GET /api/users — admin-only user directory
  app.get("/api/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const limit = Math.min(parseInt(req.query.limit as string) || 100, 100);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const search = String(req.query.search || "").trim();
      const where = search
        ? or(
            like(users.name, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.phone, `%${search}%`),
          )
        : undefined;

      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          wardId: users.wardId,
          wardName: wards.name,
          role: users.role,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .leftJoin(wards, eq(users.wardId, wards.id))
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(where);

      res.json({ users: rows, total: Number(count || 0), limit, offset });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Users] List failed:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // DELETE /api/users/:id — admin removes a user account
  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      const userId = Number(req.params.id);
      if (userId === req.dbUser!.id) {
        res.status(400).json({ error: "You cannot remove your own admin account" });
        return;
      }

      const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      await db.delete(incidentVolunteers).where(eq(incidentVolunteers.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
      res.json({ success: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Users] Delete failed:", err);
      res.status(500).json({ error: "Failed to remove user" });
    }
  });
}
