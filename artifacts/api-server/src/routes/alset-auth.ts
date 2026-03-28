import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alsetUsersTable, alsetOrganizationsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { AlsetLoginBody } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "alset-salt").digest("hex");
}

function makeToken(userId: number, role: string): string {
  const payload = { userId, role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

router.post("/alset/auth/login", async (req, res) => {
  const parsed = AlsetLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(alsetUsersTable)
      .where(eq(alsetUsersTable.email, email))
      .limit(1);

    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    let organizationName: string | null = null;
    if (user.organizationId) {
      const [org] = await db
        .select()
        .from(alsetOrganizationsTable)
        .where(eq(alsetOrganizationsTable.id, user.organizationId))
        .limit(1);
      organizationName = org?.name ?? null;
    }

    const token = makeToken(user.id, user.role);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId ?? null,
        organizationName,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/alset/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(alsetUsersTable)
      .where(eq(alsetUsersTable.id, decoded.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let organizationName: string | null = null;
    if (user.organizationId) {
      const [org] = await db
        .select()
        .from(alsetOrganizationsTable)
        .where(eq(alsetOrganizationsTable.id, user.organizationId))
        .limit(1);
      organizationName = org?.name ?? null;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId ?? null,
      organizationName,
    });
  } catch (err) {
    req.log.error({ err }, "Get me failed");
    res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
