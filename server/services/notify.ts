import { and, eq, inArray } from "drizzle-orm";
import { notifications, users } from "../../drizzle/schema";

// Loosely typed to whatever getDb() resolves to — avoids importing its
// return type here and keeps this usable from every route file.
type Db = any;

/**
 * Create a single in-app notification for one user (e.g. "your report was
 * acknowledged", "your volunteer offer was approved").
 */
export async function notifyUser(db: Db, userId: number, title: string, body: string): Promise<void> {
  try {
    await db.insert(notifications).values({ userId, title, body });
  } catch (error) {
    // Notifications are best-effort — never let a notify failure fail the
    // request that triggered it (e.g. an admin's status update).
    console.error("[Notify] Failed to notify user:", userId, error);
  }
}

/**
 * One notification per resident, either everyone ("all") or the residents of
 * the given wards. Admins are handlers, not residents, so they're never
 * included (they see everything on the dashboard anyway).
 */
export async function notifyResidents(db: Db, wards: number[] | "all", title: string, body: string): Promise<void> {
  try {
    if (wards !== "all" && wards.length === 0) return;
    const residents: { id: number }[] = await db
      .select({ id: users.id })
      .from(users)
      .where(wards === "all" ? eq(users.isAdmin, false) : and(eq(users.isAdmin, false), inArray(users.wardId, wards)));
    if (residents.length === 0) return;
    await db.insert(notifications).values(residents.map((u) => ({ userId: u.id, title, body })));
  } catch (error) {
    console.error("[Notify] Failed to notify residents:", wards, error);
  }
}
