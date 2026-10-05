import type { Express, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { incidentVolunteers, incidents, users, wards } from "../../drizzle/schema";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { AppError } from "../middleware/errorHandler";
import { notifyUser } from "../services/notify";

// Volunteering is per incident: a resident offers to help with one incident
// ("I can help"), the admin approves or declines the offer, and the incident
// shows how many approved volunteers are helping with it. (The older
// ward-level `volunteers` table is no longer used by the app.)

const offerSchema = z.object({
  note: z.string().max(500).optional(),
});

const reviewSchema = z.object({
  status: z.enum(["pending", "approved", "declined"]),
});

function handle(res: Response, err: unknown, what: string) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error(`[IncidentVolunteers] ${what} failed:`, err);
  res.status(500).json({ error: `Failed to ${what.toLowerCase()}` });
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new AppError(500, "Database not available");
  return db;
}

export function registerIncidentVolunteerRoutes(app: Express) {
  // GET /api/incidents/:id/volunteers — counts, plus the caller's own offer
  app.get("/api/incidents/:id/volunteers", requireAuth, async (req: Request, res: Response) => {
    try {
      const db = await requireDb();
      const incidentId = Number(req.params.id);
      const rows = await db
        .select({ status: incidentVolunteers.status, count: sql<number>`count(*)` })
        .from(incidentVolunteers)
        .where(eq(incidentVolunteers.incidentId, incidentId))
        .groupBy(incidentVolunteers.status);
      const count = (s: string) => Number(rows.find((r) => r.status === s)?.count ?? 0);
      const mine = await db
        .select({ id: incidentVolunteers.id, status: incidentVolunteers.status })
        .from(incidentVolunteers)
        .where(and(eq(incidentVolunteers.incidentId, incidentId), eq(incidentVolunteers.userId, req.dbUser!.id)))
        .limit(1);
      res.json({ approved: count("approved"), pending: count("pending"), mine: mine[0] ?? null });
    } catch (err) {
      handle(res, err, "Load volunteers");
    }
  });

  // POST /api/incidents/:id/volunteers — "I can help"
  app.post("/api/incidents/:id/volunteers", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = offerSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues.map((e) => e.message).join(", ") });
        return;
      }
      const db = await requireDb();
      const user = req.dbUser!;
      if (user.isAdmin) {
        res.status(400).json({ error: "Admins coordinate volunteers; they can't volunteer themselves" });
        return;
      }
      const incidentId = Number(req.params.id);
      const incident = await db.select({ id: incidents.id }).from(incidents).where(eq(incidents.id, incidentId)).limit(1);
      if (incident.length === 0) {
        res.status(404).json({ error: "Incident not found" });
        return;
      }
      const existing = await db
        .select({ id: incidentVolunteers.id, status: incidentVolunteers.status })
        .from(incidentVolunteers)
        .where(and(eq(incidentVolunteers.incidentId, incidentId), eq(incidentVolunteers.userId, user.id)))
        .limit(1);
      if (existing.length > 0) {
        res.status(409).json({
          error: existing[0].status === "declined" ? "The ward office declined your offer for this incident" : "You've already offered to help with this incident",
        });
        return;
      }
      const result = await db.insert(incidentVolunteers).values({ incidentId, userId: user.id, note: parsed.data.note });
      res.status(201).json({ volunteer: { id: Number(result[0].insertId), incidentId, status: "pending" } });
    } catch (err) {
      handle(res, err, "Offer help");
    }
  });

  // DELETE /api/incidents/:id/volunteers/me — withdraw your offer
  app.delete("/api/incidents/:id/volunteers/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const db = await requireDb();
      await db
        .delete(incidentVolunteers)
        .where(and(eq(incidentVolunteers.incidentId, Number(req.params.id)), eq(incidentVolunteers.userId, req.dbUser!.id)));
      res.json({ success: true });
    } catch (err) {
      handle(res, err, "Withdraw offer");
    }
  });

  // GET /api/incident-volunteers — admin: every offer, with who and for which incident
  app.get("/api/incident-volunteers", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const db = await requireDb();
      const { status, incidentId } = req.query;
      const conditions = [];
      if (status) conditions.push(eq(incidentVolunteers.status, status as any));
      if (incidentId) conditions.push(eq(incidentVolunteers.incidentId, Number(incidentId)));
      const rows = await db
        .select({
          id: incidentVolunteers.id,
          incidentId: incidentVolunteers.incidentId,
          incidentTitle: incidents.title,
          incidentStatus: incidents.status,
          userId: incidentVolunteers.userId,
          userName: users.name,
          userPhone: users.phone,
          userEmail: users.email,
          homeWardName: wards.name,
          note: incidentVolunteers.note,
          status: incidentVolunteers.status,
          createdAt: incidentVolunteers.createdAt,
        })
        .from(incidentVolunteers)
        .leftJoin(incidents, eq(incidentVolunteers.incidentId, incidents.id))
        .leftJoin(users, eq(incidentVolunteers.userId, users.id))
        .leftJoin(wards, eq(users.wardId, wards.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(incidentVolunteers.createdAt))
        .limit(200);
      res.json({ volunteers: rows });
    } catch (err) {
      handle(res, err, "List volunteers");
    }
  });

  // PATCH /api/incident-volunteers/:id — admin approves or declines an offer
  app.patch("/api/incident-volunteers/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = reviewSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues.map((e) => e.message).join(", ") });
        return;
      }
      const db = await requireDb();
      const id = Number(req.params.id);
      const existing = await db
        .select({ userId: incidentVolunteers.userId, status: incidentVolunteers.status, title: incidents.title })
        .from(incidentVolunteers)
        .leftJoin(incidents, eq(incidentVolunteers.incidentId, incidents.id))
        .where(eq(incidentVolunteers.id, id))
        .limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "Volunteer offer not found" });
        return;
      }
      await db.update(incidentVolunteers).set({ status: parsed.data.status }).where(eq(incidentVolunteers.id, id));
      const { userId, status, title } = existing[0];
      if (parsed.data.status !== status && parsed.data.status !== "pending") {
        notifyUser(
          db,
          userId,
          "Your volunteer status changed",
          parsed.data.status === "approved"
            ? `You're confirmed as a volunteer for "${title}". The ward office will contact you.`
            : `Thanks for offering to help with "${title}". The ward office doesn't need more volunteers for it right now.`,
        );
      }
      res.json({ success: true });
    } catch (err) {
      handle(res, err, "Update volunteer");
    }
  });
}
