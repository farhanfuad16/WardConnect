import type { Request, Response, NextFunction } from "express";

/**
 * requireAdmin — must be used AFTER requireAuth.
 * Checks that the authenticated user has admin privileges.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.dbUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!req.dbUser.isAdmin && req.dbUser.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}
