import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "./db";
import { users, wards } from "../drizzle/schema";
import { signAuthToken, verifyAuthToken, type AuthJWTPayload } from "./_core/jwt";

// ── Validation schemas ──────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  wardId: z.number().int().positive("Please select a ward"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ── Auth middleware ──────────────────────────────────────────────────

export async function authMiddleware(
  req: Request,
  res: Response,
  next: Function,
) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice("Bearer ".length).trim();
  }

  // Fallback to cookie
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

  (req as any).authUser = payload;
  next();
}

// ── Route registration ──────────────────────────────────────────────

export function registerAuthRoutes(app: Express) {
  // POST /api/auth/register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const { name, email, password, phone, wardId } = parsed.data;
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      // Check for existing email
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing.length > 0) {
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }

      // Verify ward exists
      const ward = await db
        .select({ id: wards.id })
        .from(wards)
        .where(eq(wards.id, wardId))
        .limit(1);

      if (ward.length === 0) {
        res.status(400).json({ error: "Selected ward is invalid" });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Insert user
      const result = await db.insert(users).values({
        name,
        email,
        phone: phone || null,
        passwordHash,
        wardId,
        loginMethod: "email",
      });

      const userId = Number(result[0].insertId);

      // Sign JWT
      const token = await signAuthToken({ userId, email, name });

      res.status(201).json({
        token,
        user: { id: userId, name, email, phone: phone || null, wardId },
      });
    } catch (error) {
      console.error("[Auth] Register failed:", error);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: any) => e.message).join(", ");
        res.status(400).json({ error: message });
        return;
      }

      const { email, password } = parsed.data;
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      // Find user by email
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (rows.length === 0) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const user = rows[0];

      // Verify password
      if (!user.passwordHash) {
        res.status(401).json({
          error: "This account uses social login. Please sign in with your provider.",
        });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Update lastSignedIn
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Sign JWT
      const token = await signAuthToken({
        userId: user.id,
        email: user.email ?? "",
        name: user.name ?? "",
      });

      // Fetch ward info
      let wardName: string | null = null;
      if (user.wardId) {
        const wardRow = await db
          .select({ name: wards.name })
          .from(wards)
          .where(eq(wards.id, user.wardId))
          .limit(1);
        wardName = wardRow[0]?.name ?? null;
      }

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          wardId: user.wardId,
          wardName,
        },
      });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  // GET /api/auth/me — protected
  app.get("/api/auth/me", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authPayload = (req as any).authUser as AuthJWTPayload;
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          wardId: users.wardId,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, authPayload.userId))
        .limit(1);

      if (rows.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const user = rows[0];

      // Fetch ward info
      let wardName: string | null = null;
      if (user.wardId) {
        const wardRow = await db
          .select({ name: wards.name })
          .from(wards)
          .where(eq(wards.id, user.wardId))
          .limit(1);
        wardName = wardRow[0]?.name ?? null;
      }

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          wardId: user.wardId,
          wardName,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("[Auth] /me failed:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // GET /api/wards — public
  app.get("/api/wards", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const allWards = await db.select().from(wards);
      res.json({ wards: allWards });
    } catch (error) {
      console.error("[Auth] /wards failed:", error);
      res.status(500).json({ error: "Failed to fetch wards" });
    }
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    res.json({ success: true });
  });
}
