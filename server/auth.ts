import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import type { Express, RequestHandler } from "express";
import { randomUUID, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// Password hash format: <salt-hex>:<derived-key-hex>
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(password, salt, expected.length);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function normalizeUsername(raw: string) {
  const username = raw.toLowerCase().replace(/[^a-z0-9_\-]/g, "");
  return username;
}

function validatePassword(password: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof password !== "string") return { ok: false, message: "Password is required" };
  if (password.length < 6) return { ok: false, message: "Password must be at least 6 characters" };
  if (password.length > 200) return { ok: false, message: "Password is too long" };
  return { ok: true, value: password };
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
      // Never leak password hash
      const { passwordHash: _omit, ...safe } = user as any;
      res.json(safe);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Step 1 of login: tell the client what flow to show for this username
  app.post("/api/auth/check-username", async (req, res) => {
    const raw: string = (req.body?.username || "").trim();
    if (!raw) return res.status(400).json({ message: "Username is required" });
    const username = normalizeUsername(raw);
    if (username.length < 2) {
      return res.status(400).json({
        message: "Username must be at least 2 characters (letters, numbers, _ or -)",
      });
    }

    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      if (!user) {
        return res.json({ status: "new", username });
      }
      if (user.passwordHash) {
        return res.json({ status: "existing", username });
      }
      // Existing user with no password yet — they need to set one to claim/sign in
      return res.json({ status: "needs-password", username });
    } catch (err) {
      console.error("Check username error:", err);
      res.status(500).json({ message: "Could not verify username" });
    }
  });

  // Step 2: actually log in / register
  // Body: { username, password, mode: "new" | "existing" | "needs-password" }
  app.post("/api/auth/login", async (req, res) => {
    const raw: string = (req.body?.username || "").trim();
    const mode: string = req.body?.mode || "";
    if (!raw) return res.status(400).json({ message: "Username is required" });

    const username = normalizeUsername(raw);
    if (username.length < 2) {
      return res.status(400).json({
        message: "Username must be at least 2 characters (letters, numbers, _ or -)",
      });
    }

    const pw = validatePassword(req.body?.password);
    if (!pw.ok) return res.status(400).json({ message: pw.message });

    try {
      let [user] = await db.select().from(users).where(eq(users.username, username));

      if (!user) {
        if (mode && mode !== "new") {
          return res.status(400).json({ message: "That username doesn't exist yet" });
        }
        const passwordHash = await hashPassword(pw.value);
        [user] = await db
          .insert(users)
          .values({
            id: randomUUID(),
            username,
            firstName: raw, // preserve original casing as display name
            passwordHash,
          })
          .returning();
      } else if (!user.passwordHash) {
        // Legacy account being claimed — set the password they just chose
        const passwordHash = await hashPassword(pw.value);
        [user] = await db
          .update(users)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(users.id, user.id))
          .returning();
      } else {
        // Existing account with password — verify
        const ok = await verifyPassword(pw.value, user.passwordHash);
        if (!ok) {
          return res.status(401).json({ message: "Incorrect password" });
        }
      }

      req.session.userId = user.id;
      const { passwordHash: _omit, ...safe } = user as any;
      res.json(safe);
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  // Allow a logged-in user to set or change their password
  app.post("/api/auth/set-password", isAuthenticated, async (req, res) => {
    const newPw = validatePassword(req.body?.newPassword);
    if (!newPw.ok) return res.status(400).json({ message: newPw.message });

    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.session.userId!));
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      // If there's already a password, the current one must be provided and correct
      if (user.passwordHash) {
        const current = req.body?.currentPassword;
        if (typeof current !== "string" || !current) {
          return res.status(400).json({ message: "Current password is required" });
        }
        const ok = await verifyPassword(current, user.passwordHash);
        if (!ok) return res.status(401).json({ message: "Current password is incorrect" });
      }

      const passwordHash = await hashPassword(newPw.value);
      await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));
      res.json({ ok: true });
    } catch (err) {
      console.error("Set password error:", err);
      res.status(500).json({ message: "Could not update password" });
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
