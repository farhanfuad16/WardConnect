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
 * Create one notification for every user except `exceptUserId` (e.g. a new
 * notice: the app's Notices tab shows every notice to everyone, so everyone
 * gets told about it, not just the poster's ward).
 */
export async function notifyEveryone(db: Db, title: string, body: string, exceptUserId?: number): Promise<void> {
  try {
    const allUsers: { id: number }[] = await db.select({ id: users.id }).from(users);
    const targets = allUsers.filter((u) => u.id !== exceptUserId);
    if (targets.length === 0) return;
    await db.insert(notifications).values(targets.map((u) => ({ userId: u.id, title, body })));
  } catch (error) {
    console.error("[Notify] Failed to notify everyone:", error);
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
