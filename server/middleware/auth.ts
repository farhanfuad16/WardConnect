import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { verifyAuthToken, type AuthJWTPayload } from "../_core/jwt";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

export interface AuthenticatedUser {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  wardId: number | null;
  role: "user" | "admin";
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthJWTPayload;
      dbUser?: AuthenticatedUser;
    }
  }
}

/**
 * requireAuth — verifies JWT and attaches the full DB user record to req.dbUser.
 * Use this on any route that needs the user's role, wardId, or isAdmin flag.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice("Bearer ".length).trim();
  }

  if (!token && req.cookies?.app_session_id) {
    token = req.cookies.app_session_id;
  }

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const payload = await verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.authUser = payload;

  // Fetch full user record from DB
  const db = await getDb();
  if (!db) {
    res.status(500).json({ error: "Database not available" });
    return;
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (rows.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const row = rows[0];
  req.dbUser = {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    wardId: row.wardId,
    role: row.role,
    isAdmin: row.isAdmin,
  };

  next();
}

/**
 * optionalAuth — like requireAuth but doesn't 401 if no token.
 * Attaches user info if a valid token is present.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice("Bearer ".length).trim();
  }

  if (!token && req.cookies?.app_session_id) {
    token = req.cookies.app_session_id;
  }

  if (!token) {
    next();
    return;
  }

  const payload = await verifyAuthToken(token);
  if (!payload) {
    next();
    return;
  }

  req.authUser = payload;

  const db = await getDb();
  if (db) {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (rows.length > 0) {
      const row = rows[0];
      req.dbUser = {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        wardId: row.wardId,
        role: row.role,
        isAdmin: row.isAdmin,
      };
    }
  }

  next();
}
