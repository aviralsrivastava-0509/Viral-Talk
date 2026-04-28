import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import type { Express, RequestHandler } from "express";
import { randomUUID } from "crypto";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function setupAuth(app: Express) {
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: 7 * 24 * 60 * 60,
    tableName: "sessions",
  });

  app.set("trust proxy", 1);
  const isProduction = process.env.NODE_ENV === "production";
  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    })
  );
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.userId) return next();
  res.status(401).json({ message: "Unauthorized" });
};

export function registerAuthRoutes(app: Express) {
  // Get current logged-in user
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.session.userId!));
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.json(user);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Login or register with just a username
  app.post("/api/auth/login", async (req, res) => {
    const raw: string = (req.body?.username || "").trim();
    if (!raw) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Allow letters, numbers, underscores, hyphens — store lowercase
    const username = raw.toLowerCase().replace(/[^a-z0-9_\-]/g, "");
    if (username.length < 2) {
      return res
        .status(400)
        .json({ message: "Username must be at least 2 characters (letters, numbers, _ or -)" });
    }

    try {
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (!user) {
        // Auto-register: create a new account
        [user] = await db
          .insert(users)
          .values({
            id: randomUUID(),
            username,
            firstName: raw, // preserve original casing as display name
          })
          .returning();
      }

      req.session.userId = user.id;
      res.json(user);
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error("Logout error:", err);
      res.json({ ok: true });
    });
  });

  // Stub out old Replit OAuth routes so nothing breaks
  app.get("/api/login", (_req, res) => res.redirect("/"));
  app.get("/api/callback", (_req, res) => res.redirect("/"));
  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
  });
}
