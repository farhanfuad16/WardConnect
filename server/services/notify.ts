import { eq } from "drizzle-orm";
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
 * Create one notification per resident of a ward (e.g. "a new notice was
 * posted for your ward").
 */
export async function notifyWard(db: Db, wardId: number, title: string, body: string): Promise<void> {
  try {
    const wardUsers = await db.select({ id: users.id }).from(users).where(eq(users.wardId, wardId));
    if (wardUsers.length === 0) return;
    await db.insert(notifications).values(wardUsers.map((u: { id: number }) => ({ userId: u.id, title, body })));
  } catch (error) {
    console.error("[Notify] Failed to notify ward:", wardId, error);
  }
}
