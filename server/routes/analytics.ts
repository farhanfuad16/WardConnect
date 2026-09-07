import type { Express, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { issues, sosAlerts, incidents, notices, resources, volunteers, users } from "../../drizzle/schema";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { AppError } from "../middleware/errorHandler";

export function registerAnalyticsRoutes(app: Express) {
  // GET /api/analytics/summary — admin only
  app.get("/api/analytics/summary", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new AppError(500, "Database not available");

      // Get counts for all major entities
      const [issuesCount] = await db.select({ count: sql<number>`count(*)` }).from(issues);
      const [sosCount] = await db.select({ count: sql<number>`count(*)` }).from(sosAlerts);
      const [incidentsCount] = await db.select({ count: sql<number>`count(*)` }).from(incidents);
      const [noticesCount] = await db.select({ count: sql<number>`count(*)` }).from(notices);
      const [resourcesCount] = await db.select({ count: sql<number>`count(*)` }).from(resources);
      const [volunteersCount] = await db.select({ count: sql<number>`count(*)` }).from(volunteers);
      const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);

      // Get issues by status
      const issuesByStatus = await db
        .select({
          status: issues.status,
          count: sql<number>`count(*)`,
        })
        .from(issues)
        .groupBy(issues.status);

      // Get SOS alerts this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const [sosThisWeek] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sosAlerts)
        .where(sql`${sosAlerts.createdAt} >= ${oneWeekAgo}`);

      // Get pending volunteers
      const [pendingVolunteers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(volunteers)
        .where(sql`${volunteers.status} = 'pending'`);

      // Get unverified incidents (no verifiedBy set)
      const [unverifiedIncidents] = await db
        .select({ count: sql<number>`count(*)` })
        .from(incidents)
        .where(sql`${incidents.verifiedBy} IS NULL`);

      res.json({
        totalIssues: issuesCount?.count || 0,
        totalSosAlerts: sosCount?.count || 0,
        totalIncidents: incidentsCount?.count || 0,
        totalNotices: noticesCount?.count || 0,
        totalResources: resourcesCount?.count || 0,
        totalVolunteers: volunteersCount?.count || 0,
        totalUsers: usersCount?.count || 0,
        issuesByStatus,
        sosThisWeek: sosThisWeek?.count || 0,
        pendingVolunteers: pendingVolunteers?.count || 0,
        unverifiedIncidents: unverifiedIncidents?.count || 0,
      });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("[Analytics] Summary failed:", err);
      res.status(500).json({ error: "Failed to fetch analytics summary" });
    }
  });
}